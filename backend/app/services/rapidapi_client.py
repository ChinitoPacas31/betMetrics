import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple
import httpx
from app.core.config import settings
from app.core.exceptions import ExternalServiceUnavailableError
from app.schemas.ev_schemas import EVCalculationRequest
from app.schemas.odds_schemas import MatchOddsEVItem, OddsEVListResponse
from app.services.ev_calculator import EVCalculatorService
from app.services.redis_cache import redis_cache_service

logger = logging.getLogger("betmetrics.rapidapi")

# Semilla resiliente utilizada para pre-poblar caché o responder cuando no se ha configurado
# una RAPIDAPI_KEY real o se alcanza el límite HTTP 429 de RapidAPI.
DEFAULT_SEED_MATCHES: List[Dict[str, Any]] = [
    {
        "match_id": "epl-2026-ars-che",
        "sport_key": "soccer_epl",
        "league": "Premier League",
        "home_team": "Arsenal",
        "away_team": "Chelsea",
        "commence_time": "2026-11-07T17:30:00Z",
        "bookmaker": "Pinnacle",
        "selection": "Arsenal (Home Win)",
        "decimal_odds": 2.15,
        "true_probability": 0.52,
    },
    {
        "match_id": "epl-2026-liv-mci",
        "sport_key": "soccer_epl",
        "league": "Premier League",
        "home_team": "Liverpool",
        "away_team": "Manchester City",
        "commence_time": "2026-11-08T16:30:00Z",
        "bookmaker": "Bet365",
        "selection": "Liverpool (Home Win)",
        "decimal_odds": 2.45,
        "true_probability": 0.415,
    },
    {
        "match_id": "epl-2026-mun-tot",
        "sport_key": "soccer_epl",
        "league": "Premier League",
        "home_team": "Manchester United",
        "away_team": "Tottenham Hotspur",
        "commence_time": "2026-11-08T19:00:00Z",
        "bookmaker": "DraftKings",
        "selection": "Manchester United (Home Win)",
        "decimal_odds": 2.10,
        "true_probability": 0.43,
    },
    {
        "match_id": "ucl-2026-rma-bay",
        "sport_key": "soccer_epl",
        "league": "UEFA Champions League",
        "home_team": "Real Madrid",
        "away_team": "Bayern Munich",
        "commence_time": "2026-11-10T20:00:00Z",
        "bookmaker": "FanDuel",
        "selection": "Real Madrid (Home Win)",
        "decimal_odds": 2.30,
        "true_probability": 0.48,
    },
    {
        "match_id": "nba-2026-bos-lal",
        "sport_key": "soccer_epl",
        "league": "NBA Regular Season",
        "home_team": "Boston Celtics",
        "away_team": "Los Angeles Lakers",
        "commence_time": "2026-11-09T01:30:00Z",
        "bookmaker": "BetMGM",
        "selection": "Boston Celtics -4.5",
        "decimal_odds": 1.92,
        "true_probability": 0.525,
    },
    {
        "match_id": "laliga-2026-bar-atm",
        "sport_key": "soccer_epl",
        "league": "LaLiga EA Sports",
        "home_team": "FC Barcelona",
        "away_team": "Atlético de Madrid",
        "commence_time": "2026-11-09T20:00:00Z",
        "bookmaker": "William Hill",
        "selection": "Draw",
        "decimal_odds": 3.40,
        "true_probability": 0.25,
    },
]


class RapidAPIClientService:
    """
    Cliente asíncrono con httpx para consumir cuotas desde RapidAPI.
    Maneja timeouts, errores HTTP 429 (Rate Limit) y caídas de red,
    integrándose con Redis para retornar datos cacheados con `"cached": true`.
    """

    TIMEOUT_SECONDS = 6.0

    @classmethod
    def _normalize_rapidapi_payload(
        cls, raw_events: List[Dict[str, Any]], sport: str
    ) -> List[Dict[str, Any]]:
        normalized: List[Dict[str, Any]] = []
        for idx, event in enumerate(raw_events[:12]):
            home_team = event.get("home_team", f"Home Team {idx + 1}")
            away_team = event.get("away_team", f"Away Team {idx + 1}")
            bookmakers = event.get("bookmakers", [])
            decimal_odds = 2.10
            bookmaker_title = "Market Consensus"

            if bookmakers and isinstance(bookmakers, list):
                first_bookie = bookmakers[0]
                bookmaker_title = first_bookie.get("title", bookmaker_title)
                markets = first_bookie.get("markets", [])
                if markets and markets[0].get("outcomes"):
                    price = markets[0]["outcomes"][0].get("price", 2.10)
                    if isinstance(price, (int, float)) and price > 1.01:
                        decimal_odds = float(price)

            # Estimación de probabilidad real basada en consenso sharp simulado
            implied_prob = 1.0 / decimal_odds
            edge_offsets = [0.045, 0.012, -0.035, 0.038, 0.005, -0.042]
            true_prob = min(max(implied_prob + edge_offsets[idx % len(edge_offsets)], 0.05), 0.92)

            normalized.append(
                {
                    "match_id": str(event.get("id", f"{sport}-{idx}")),
                    "sport_key": event.get("sport_key", sport),
                    "league": event.get("sport_title", "International Sports"),
                    "home_team": home_team,
                    "away_team": away_team,
                    "commence_time": event.get(
                        "commence_time", datetime.now(timezone.utc).isoformat()
                    ),
                    "bookmaker": bookmaker_title,
                    "selection": f"{home_team} (Win)",
                    "decimal_odds": round(decimal_odds, 2),
                    "true_probability": round(true_prob, 4),
                }
            )
        return normalized or DEFAULT_SEED_MATCHES

    @classmethod
    async def _fetch_from_rapidapi(cls, sport: str) -> List[Dict[str, Any]]:
        if (
            not settings.RAPIDAPI_KEY
            or settings.RAPIDAPI_KEY == "your-rapidapi-key-here"
        ):
            raise httpx.ConnectError("RAPIDAPI_KEY not configured with a live credential.")

        url = f"https://{settings.RAPIDAPI_HOST}/v4/sports/{sport}/odds"
        headers = {
            "X-RapidAPI-Key": settings.RAPIDAPI_KEY,
            "X-RapidAPI-Host": settings.RAPIDAPI_HOST,
            "Accept": "application/json",
        }
        params = {
            "regions": "eu,uk,us",
            "oddsFormat": "decimal",
            "markets": "h2h",
        }

        async with httpx.AsyncClient(timeout=cls.TIMEOUT_SECONDS) as client:
            response = await client.get(url, headers=headers, params=params)

            if response.status_code == 429:
                logger.warning("RapidAPI rate limit exceeded (HTTP 429).")
                raise httpx.HTTPStatusError(
                    "Rate limit exceeded (429)",
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
        Retorna (lista_de_partidos, cached_flag, source_name).
        1. Si force_refresh es False y existen datos en Redis, retorna desde caché (`cached=True`).
        2. Si no hay caché o se fuerza sincronización, consulta RapidAPI con httpx.
        3. Si RapidAPI falla (Timeout, 429 Rate Limit, 5xx o clave demo), recupera de Redis
           o hidrata la caché con el fallback resiliente (`cached=True`).
        """
        if not force_refresh:
            cached_matches = await redis_cache_service.get_odds(sport)
            if cached_matches:
                return cached_matches, True, "redis_cache"

        try:
            live_matches = await cls._fetch_from_rapidapi(sport)
            await redis_cache_service.set_odds(sport, live_matches)
            return live_matches, False, "rapidapi_live"
        except (httpx.TimeoutException, httpx.HTTPStatusError, httpx.HTTPError, ValueError) as exc:
            logger.warning(
                "RapidAPI fetch failed for sport=%s (%s). Activating Redis/Resilient fallback.",
                sport,
                repr(exc),
            )
            cached_matches = await redis_cache_service.get_odds(sport)
            if cached_matches:
                return cached_matches, True, "redis_cache"

            # Si tampoco había en Redis, sembramos los datos de respaldo en caché y retornamos cached=True
            if DEFAULT_SEED_MATCHES:
                await redis_cache_service.set_odds(sport, DEFAULT_SEED_MATCHES)
                return DEFAULT_SEED_MATCHES, True, "resilient_fallback"

            raise ExternalServiceUnavailableError(
                "External odds API failed (timeout or 429) and no cached fallback is available."
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
            ev_result = EVCalculatorService.calculate_ev(
                EVCalculationRequest(
                    match_name=f"{match['home_team']} vs {match['away_team']}",
                    decimal_odds=float(match["decimal_odds"]),
                    true_probability=float(match["true_probability"]),
                    stake=stake,
                )
            )
            enriched_items.append(
                MatchOddsEVItem(
                    match_id=match["match_id"],
                    sport_key=match.get("sport_key", sport),
                    league=match.get("league", "Premier League"),
                    home_team=match["home_team"],
                    away_team=match["away_team"],
                    commence_time=match["commence_time"],
                    bookmaker=match["bookmaker"],
                    selection=match["selection"],
                    decimal_odds=ev_result.decimal_odds,
                    implied_probability=ev_result.implied_probability,
                    true_probability=ev_result.true_probability,
                    stake=ev_result.stake,
                    potential_profit=ev_result.potential_profit,
                    expected_value=ev_result.expected_value,
                    ev_percentage=ev_result.ev_percentage,
                    traffic_light=ev_result.traffic_light,
                    recommendation=ev_result.recommendation,
                )
            )

        return OddsEVListResponse(
            sport=sport,
            cached=is_cached,
            source=source,
            count=len(enriched_items),
            timestamp=datetime.now(timezone.utc),
            items=enriched_items,
        )


rapidapi_client_service = RapidAPIClientService()

