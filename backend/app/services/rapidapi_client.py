import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple
import httpx
from app.core.config import settings
from app.core.exceptions import ExternalServiceUnavailableError
from app.schemas.ev_schemas import EVCalculationRequest
from app.schemas.odds_schemas import (
    MarketOutcomeEVItem,
    MatchOddsEVItem,
    OddsEVListResponse,
    SportCatalogItem,
)
from app.services.ev_calculator import EVCalculatorService
from app.services.redis_cache import redis_cache_service
from app.services.team_logo_service import team_logo_service

logger = logging.getLogger("betmetrics.rapidapi")

# Casas de apuestas de referencia institucional (bajo margen) usadas para ponderar el de-vigging
SHARP_BOOKMAKERS = {
    "pinnacle",
    "betfair",
    "betfair_ex_eu",
    "betfair_ex_uk",
    "matchbook",
    "lowvig",
    "marathonbet",
}


class RapidAPIClientService:
    """
    Cliente asíncrono 100% real (cero datos mockeados o inventados) para The Odds API vía RapidAPI.
    Estrategia ante HTTP 429 (Rate Limit) o caída de red:
      1. Caché Fresca en Redis (TTL 5 min) para no agotar la cuota en navegación normal.
      2. Respaldo Stale-If-Error en Redis (TTL 24h) con la última captura REAL si RapidAPI devuelve 429.
      3. Si no existe ninguna captura real previa en Redis y RapidAPI falla/429, responde HTTP 503 honesto.
    """

    TIMEOUT_SECONDS = 8.0

    @classmethod
    def _ensure_api_key_configured(cls) -> None:
        if not settings.RAPIDAPI_KEY or not settings.RAPIDAPI_KEY.strip():
            raise ExternalServiceUnavailableError(
                "RAPIDAPI_KEY is not configured in the environment variables (.env)."
            )

    @classmethod
    def _build_headers(cls) -> Dict[str, str]:
        return {
            "X-RapidAPI-Key": settings.RAPIDAPI_KEY,
            "X-RapidAPI-Host": settings.RAPIDAPI_HOST,
            "Accept": "application/json",
        }

    @classmethod
    async def get_sports_catalog(cls) -> List[SportCatalogItem]:
        """
        Obtiene dinámicamente desde RapidAPI (`GET /v4/sports`) todas las ligas y deportes
        activos en este momento, sin listas hardcodeadas.
        """
        fresh = await redis_cache_service.get_fresh_sports()
        if fresh is not None:
            return [SportCatalogItem(**item) for item in fresh]

        cls._ensure_api_key_configured()
        url = f"https://{settings.RAPIDAPI_HOST}/v4/sports"

        try:
            async with httpx.AsyncClient(timeout=cls.TIMEOUT_SECONDS) as client:
                response = await client.get(
                    url, headers=cls._build_headers(), params={"all": "false"}
                )
                if response.status_code == 429:
                    raise httpx.HTTPStatusError(
                        "RapidAPI quota exceeded (HTTP 429)",
                        request=response.request,
                        response=response,
                    )
                response.raise_for_status()
                raw_sports = response.json()
                if not isinstance(raw_sports, list):
                    raise ValueError("Unexpected format in /v4/sports from RapidAPI.")

            catalog: List[Dict[str, str]] = []
            for item in raw_sports:
                if not item.get("active", False) or item.get("has_outrights", False):
                    continue
                s_key = str(item.get("key", "")).strip()
                if not s_key:
                    continue
                group = str(item.get("group") or "Sports").strip()
                title = str(item.get("title") or s_key).strip()
                description = str(item.get("description") or group).strip()
                market_type = "h2h_3way" if s_key.startswith("soccer") else "h2h_2way"
                catalog.append(
                    {
                        "sport_key": s_key,
                        "title": title,
                        "category": group,
                        "country": description,
                        "market_type": market_type,
                    }
                )

            await redis_cache_service.set_sports(catalog)
            return [SportCatalogItem(**item) for item in catalog]

        except (httpx.HTTPStatusError, httpx.HTTPError, ValueError) as exc:
            logger.warning("Failed fetching /v4/sports from RapidAPI: %s", repr(exc))
            stale = await redis_cache_service.get_stale_sports()
            if stale is not None:
                return [SportCatalogItem(**item) for item in stale]

            if (
                isinstance(exc, httpx.HTTPStatusError)
                and exc.response.status_code == 429
            ):
                raise ExternalServiceUnavailableError(
                    "RapidAPI request quota exceeded (HTTP 429) while fetching active sports and no prior backup exists in Redis."
                ) from exc

            raise ExternalServiceUnavailableError(
                "Could not fetch the active sports catalog from RapidAPI or Redis."
            ) from exc

    @classmethod
    def _normalize_rapidapi_payload(
        cls, raw_events: List[Dict[str, Any]], sport: str
    ) -> List[Dict[str, Any]]:
        """
        Procesa exclusivamente los eventos reales devueltos por RapidAPI.
        Si la liga no tiene partidos activos o cuotas H2H disponibles hoy, devuelve `[]` honestamente.
        """
        expected_3way = sport.startswith("soccer")
        normalized: List[Dict[str, Any]] = []

        for event in raw_events:
            match_id = str(event.get("id") or "").strip()
            home_team = str(event.get("home_team") or "").strip()
            away_team = str(event.get("away_team") or "").strip()
            if not match_id or not home_team or not away_team:
                continue

            bookmakers = event.get("bookmakers") or []
            if not isinstance(bookmakers, list) or len(bookmakers) == 0:
                continue

            weighted_prob_sums: Dict[str, float] = {"1": 0.0, "X": 0.0, "2": 0.0}
            weight_totals: Dict[str, float] = {"1": 0.0, "X": 0.0, "2": 0.0}
            best_prices: Dict[str, Tuple[float, str]] = {}
            valid_bookies_count = 0

            for bookie in bookmakers:
                b_key = str(bookie.get("key", "")).lower()
                b_title = str(bookie.get("title") or b_key or "Bookmaker")
                markets = bookie.get("markets") or []
                h2h_market = next(
                    (m for m in markets if m.get("key") == "h2h"),
                    None,
                )
                if not h2h_market:
                    continue

                outcomes_raw = h2h_market.get("outcomes") or []
                bookie_prices: Dict[str, float] = {}
                for out in outcomes_raw:
                    name = str(out.get("name", "")).strip()
                    price = out.get("price")
                    if not isinstance(price, (int, float)) or price <= 1.01:
                        continue
                    p_val = float(price)
                    if name == home_team:
                        bookie_prices["1"] = p_val
                    elif name == away_team:
                        bookie_prices["2"] = p_val
                    elif name.lower() in ("draw", "empate", "tie"):
                        bookie_prices["X"] = p_val

                if "1" not in bookie_prices or "2" not in bookie_prices:
                    continue

                valid_bookies_count += 1
                overround = sum(1.0 / odd for odd in bookie_prices.values())
                if overround <= 0:
                    continue

                weight = 3.0 if b_key in SHARP_BOOKMAKERS else 1.0
                for k, odd in bookie_prices.items():
                    fair_p = (1.0 / odd) / overround
                    weighted_prob_sums[k] += fair_p * weight
                    weight_totals[k] += weight
                    current_best = best_prices.get(k)
                    if current_best is None or odd > current_best[0]:
                        best_prices[k] = (odd, b_title)

            has_draw = expected_3way and ("X" in best_prices)
            outcome_keys = ["1", "X", "2"] if has_draw else ["1", "2"]
            market_type = "h2h_3way" if has_draw else "h2h_2way"

            if not all(k in best_prices for k in outcome_keys):
                continue

            raw_true_probs: Dict[str, float] = {}
            for k in outcome_keys:
                if weight_totals[k] > 0:
                    raw_true_probs[k] = weighted_prob_sums[k] / weight_totals[k]
                else:
                    raw_true_probs[k] = 1.0 / best_prices[k][0]

            total_true = sum(raw_true_probs.values()) or 1.0
            selection_names = {
                "1": home_team,
                "X": "Draw",
                "2": away_team,
            }

            outcomes_payload: List[Dict[str, Any]] = []
            for k in outcome_keys:
                odd_val, bookie_name = best_prices[k]
                fair_prob = min(max(raw_true_probs[k] / total_true, 0.005), 0.99)
                outcomes_payload.append(
                    {
                        "key": k,
                        "selection": selection_names[k],
                        "bookmaker": bookie_name,
                        "decimal_odds": round(odd_val, 3),
                        "true_probability": round(fair_prob, 4),
                    }
                )

            sport_title = str(event.get("sport_title") or sport)
            sport_key_val = str(event.get("sport_key") or sport)
            sport_group_label = sport_key_val.split("_")[0].replace("americanfootball", "American Football").replace("icehockey", "Ice Hockey").title()
            normalized.append(
                {
                    "match_id": match_id,
                    "sport_key": sport_key_val,
                    "league": sport_title,
                    "country": sport_group_label,
                    "market_type": market_type,
                    "bookmakers_count": valid_bookies_count,
                    "home_team": home_team,
                    "away_team": away_team,
                    "commence_time": str(
                        event.get("commence_time")
                        or datetime.now(timezone.utc).isoformat()
                    ),
                    "outcomes": outcomes_payload,
                }
            )

        return normalized

    @classmethod
    async def _fetch_from_rapidapi(cls, sport: str) -> List[Dict[str, Any]]:
        cls._ensure_api_key_configured()

        url = f"https://{settings.RAPIDAPI_HOST}/v4/sports/{sport}/odds"
        params = {
            "regions": "eu,uk,us",
            "oddsFormat": "decimal",
            "markets": "h2h",
        }

        async with httpx.AsyncClient(timeout=cls.TIMEOUT_SECONDS) as client:
            response = await client.get(
                url, headers=cls._build_headers(), params=params
            )

            if response.status_code == 429:
                logger.warning("RapidAPI rate limit exceeded (HTTP 429) for sport=%s.", sport)
                raise httpx.HTTPStatusError(
                    "Rate limit exceeded (HTTP 429)",
                    request=response.request,
                    response=response,
                )

            response.raise_for_status()
            payload = response.json()
            if not isinstance(payload, list):
                raise ValueError("Unexpected response format from RapidAPI.")
            return cls._normalize_rapidapi_payload(payload, sport)

    @classmethod
    async def fetch_matches_with_resilience(
        cls, sport: str, force_refresh: bool = False
    ) -> Tuple[List[Dict[str, Any]], bool, str]:
        """
        Flujo 100% libre de mocks:
        1. Si `force_refresh` es False y existe caché fresca en Redis (TTL 5m), retorna `redis_cache`.
        2. Si expiró o se fuerza refresh, consulta RapidAPI en vivo -> guarda en `fresh` y `stale`, retorna `rapidapi_live`.
        3. Si RapidAPI devuelve HTTP 429 o falla:
           - Si existe captura REAL previa en `stale` Redis (últimas 24h), retorna esa foto real marcando
             `source="redis_stale_429"` o `"redis_stale_error"` con `cached=True`.
           - Si NO existe captura previa en Redis, lanza HTTP 503 (`ExternalServiceUnavailableError`) explicando la causa exacta.
        """
        if not force_refresh:
            fresh_matches = await redis_cache_service.get_fresh_odds(sport)
            if fresh_matches is not None:
                return fresh_matches, True, "redis_cache"

        try:
            live_matches = await cls._fetch_from_rapidapi(sport)
            await redis_cache_service.set_odds(sport, live_matches)
            return live_matches, False, "rapidapi_live"
        except ExternalServiceUnavailableError:
            raise
        except (
            httpx.TimeoutException,
            httpx.HTTPStatusError,
            httpx.HTTPError,
            ValueError,
        ) as exc:
            is_rate_limit = (
                isinstance(exc, httpx.HTTPStatusError)
                and exc.response.status_code == 429
            )
            is_unauthorized = (
                isinstance(exc, httpx.HTTPStatusError)
                and exc.response.status_code in (401, 403)
            )

            logger.warning(
                "RapidAPI fetch failed for sport=%s (429=%s, err=%s). Checking Redis stale real snapshot.",
                sport,
                is_rate_limit,
                repr(exc),
            )

            stale_matches = await redis_cache_service.get_stale_odds(sport)
            if stale_matches is not None:
                fallback_source = (
                    "redis_stale_429" if is_rate_limit else "redis_stale_error"
                )
                return stale_matches, True, fallback_source

            if is_rate_limit:
                raise ExternalServiceUnavailableError(
                    f"RapidAPI quota exceeded (HTTP 429 Too Many Requests) and no prior cache exists in Redis for '{sport}'."
                ) from exc

            if is_unauthorized:
                raise ExternalServiceUnavailableError(
                    f"RapidAPI rejected the credentials (HTTP {exc.response.status_code}). Check your RAPIDAPI_KEY and The Odds API subscription."
                ) from exc

            if isinstance(exc, httpx.HTTPStatusError) and exc.response.status_code in (
                404,
                422,
            ):
                raise ExternalServiceUnavailableError(
                    f"The league or sport '{sport}' is unavailable or does not support H2H markets in RapidAPI (HTTP {exc.response.status_code})."
                ) from exc

            raise ExternalServiceUnavailableError(
                f"Communication error with RapidAPI for '{sport}' and no prior backup exists in Redis."
            ) from exc

    @classmethod
    async def get_odds_with_ev(
        cls, sport: str = "soccer_epl", stake: float = 100.0
    ) -> OddsEVListResponse:
        raw_matches, is_cached, source = await cls.fetch_matches_with_resilience(
            sport=sport, force_refresh=False
        )

        enriched_items: List[MatchOddsEVItem] = []
        for match in raw_matches:
            match_title = f"{match['home_team']} vs {match['away_team']}"
            raw_outcomes = match.get("outcomes") or []
            if not raw_outcomes:
                continue

            outcome_items: List[MarketOutcomeEVItem] = []
            for raw_out in raw_outcomes:
                ev_calc = EVCalculatorService.calculate_ev(
                    EVCalculationRequest(
                        match_name=match_title,
                        decimal_odds=float(raw_out["decimal_odds"]),
                        true_probability=float(raw_out["true_probability"]),
                        stake=stake,
                    )
                )
                outcome_items.append(
                    MarketOutcomeEVItem(
                        key=str(raw_out["key"]),
                        selection=str(raw_out["selection"]),
                        bookmaker=str(raw_out["bookmaker"]),
                        decimal_odds=ev_calc.decimal_odds,
                        implied_probability=ev_calc.implied_probability,
                        true_probability=ev_calc.true_probability,
                        stake=ev_calc.stake,
                        potential_profit=ev_calc.potential_profit,
                        expected_value=ev_calc.expected_value,
                        ev_percentage=ev_calc.ev_percentage,
                        traffic_light=ev_calc.traffic_light,
                        recommendation=ev_calc.recommendation,
                    )
                )

            best_outcome = max(outcome_items, key=lambda item: item.ev_percentage)

            enriched_items.append(
                MatchOddsEVItem(
                    match_id=match["match_id"],
                    sport_key=match.get("sport_key", sport),
                    league=match.get("league", sport),
                    country=match.get("country", ""),
                    market_type=match.get(
                        "market_type",
                        "h2h_3way" if len(outcome_items) == 3 else "h2h_2way",
                    ),
                    bookmakers_count=int(match.get("bookmakers_count", 1)),
                    home_team=match["home_team"],
                    away_team=match["away_team"],
                    commence_time=match["commence_time"],
                    bookmaker=best_outcome.bookmaker,
                    selection=best_outcome.selection,
                    decimal_odds=best_outcome.decimal_odds,
                    implied_probability=best_outcome.implied_probability,
                    true_probability=best_outcome.true_probability,
                    stake=best_outcome.stake,
                    potential_profit=best_outcome.potential_profit,
                    expected_value=best_outcome.expected_value,
                    ev_percentage=best_outcome.ev_percentage,
                    traffic_light=best_outcome.traffic_light,
                    recommendation=best_outcome.recommendation,
                    outcomes=outcome_items,
                )
            )

        logo_teams = [
            (item.sport_key, team_name)
            for item in enriched_items
            for team_name in (item.home_team, item.away_team)
        ]
        team_logos = await team_logo_service.resolve_logos(logo_teams)
        enriched_items = [
            item.model_copy(
                update={
                    "home_team_logo": team_logos.get((item.sport_key, item.home_team)),
                    "away_team_logo": team_logos.get((item.sport_key, item.away_team)),
                }
            )
            for item in enriched_items
        ]

        return OddsEVListResponse(
            sport=sport,
            cached=is_cached,
            source=source,
            count=len(enriched_items),
            timestamp=datetime.now(timezone.utc),
            items=enriched_items,
        )


rapidapi_client_service = RapidAPIClientService()
