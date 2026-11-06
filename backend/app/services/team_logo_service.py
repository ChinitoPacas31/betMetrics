import asyncio
import hashlib
import logging
import re
import unicodedata
from typing import Dict, List, Optional, Tuple
from urllib.parse import quote, urlparse

import httpx

from app.core.config import settings
from app.services.redis_cache import redis_cache_service

logger = logging.getLogger("betmetrics.team_logos")

TeamKey = Tuple[str, str]


class TeamLogoService:
    """Resolves exact team-name matches from TheSportsDB and caches them in Redis."""

    BASE_URL = "https://www.thesportsdb.com/api/v1/json"
    TIMEOUT_SECONDS = 4.0
    MAX_CONCURRENT_LOOKUPS = 5

    SPORT_NAMES = {
        "soccer": "soccer",
        "basketball": "basketball",
        "americanfootball": "americanfootball",
        "baseball": "baseball",
        "icehockey": "icehockey",
        "cricket": "cricket",
        "rugby": "rugby",
        "tennis": "tennis",
    }

    @staticmethod
    def _normalize(value: str) -> str:
        decomposed = unicodedata.normalize("NFKD", value.casefold())
        without_marks = "".join(
            char for char in decomposed if not unicodedata.combining(char)
        )
        return re.sub(r"[^a-z0-9]+", "", without_marks)

    @classmethod
    def _cache_key(cls, sport_key: str, team_name: str) -> str:
        normalized = f"{sport_key.casefold()}:{cls._normalize(team_name)}"
        digest = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
        return f"betmetrics:team-logo:v1:{digest}"

    @classmethod
    def _expected_sport(cls, sport_key: str) -> Optional[str]:
        prefix = sport_key.split("_", 1)[0].casefold()
        return cls.SPORT_NAMES.get(prefix)

    @classmethod
    def _find_badge(
        cls, teams: object, team_name: str, sport_key: str
    ) -> Optional[str]:
        if not isinstance(teams, list):
            return None

        wanted_name = cls._normalize(team_name)
        wanted_sport = cls._expected_sport(sport_key)
        for team in teams:
            if not isinstance(team, dict):
                continue
            if cls._normalize(str(team.get("strTeam") or "")) != wanted_name:
                continue

            returned_sport = cls._normalize(str(team.get("strSport") or ""))
            if wanted_sport and returned_sport and returned_sport != wanted_sport:
                continue

            badge = team.get("strTeamBadge") or team.get("strBadge")
            if not isinstance(badge, str):
                continue
            parsed = urlparse(badge)
            hostname = (parsed.hostname or "").casefold()
            if (
                parsed.scheme == "https"
                and (
                    hostname == "thesportsdb.com"
                    or hostname.endswith(".thesportsdb.com")
                )
            ):
                return badge
        return None

    async def _fetch_logo(
        self,
        client: httpx.AsyncClient,
        semaphore: asyncio.Semaphore,
        sport_key: str,
        team_name: str,
    ) -> Tuple[bool, Optional[str]]:
        api_key = settings.THESPORTSDB_API_KEY.strip()
        url = f"{self.BASE_URL}/{quote(api_key, safe='')}/searchteams.php"
        try:
            async with semaphore:
                response = await client.get(url, params={"t": team_name})
                response.raise_for_status()
                payload = response.json()
            if not isinstance(payload, dict):
                return False, None
            return True, self._find_badge(payload.get("teams"), team_name, sport_key)
        except (httpx.HTTPError, ValueError) as exc:
            logger.info(
                "Team badge lookup failed for sport=%s team=%r (%s).",
                sport_key,
                team_name,
                type(exc).__name__,
            )
            return False, None

    async def resolve_logos(
        self, teams: List[TeamKey]
    ) -> Dict[TeamKey, Optional[str]]:
        """Resolve unique (sport, name) pairs; provider failures never break odds."""
        unique_teams = list(dict.fromkeys(teams))
        result: Dict[TeamKey, Optional[str]] = {key: None for key in unique_teams}
        if not unique_teams or not settings.THESPORTSDB_API_KEY.strip():
            return result

        pending: List[TeamKey] = []
        for team_key in unique_teams:
            cache_key = self._cache_key(*team_key)
            is_cached, logo_url = await redis_cache_service.get_team_logo(cache_key)
            if is_cached:
                result[team_key] = logo_url
            else:
                pending.append(team_key)

        if not pending:
            return result

        semaphore = asyncio.Semaphore(self.MAX_CONCURRENT_LOOKUPS)
        async with httpx.AsyncClient(timeout=self.TIMEOUT_SECONDS) as client:
            fetched = await asyncio.gather(
                *(
                    self._fetch_logo(client, semaphore, sport_key, team_name)
                    for sport_key, team_name in pending
                )
            )

        for team_key, (request_succeeded, logo_url) in zip(pending, fetched):
            result[team_key] = logo_url
            if request_succeeded:
                ttl = (
                    settings.TEAM_LOGO_CACHE_TTL_SECONDS
                    if logo_url
                    else settings.TEAM_LOGO_MISS_CACHE_TTL_SECONDS
                )
                await redis_cache_service.set_team_logo(
                    self._cache_key(*team_key), logo_url, ttl
                )

        return result


team_logo_service = TeamLogoService()
