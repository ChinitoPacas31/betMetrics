import json
import logging
from typing import Any, Dict, List, Optional
import redis.asyncio as redis
from app.core.config import settings

logger = logging.getLogger("betmetrics.cache")


class RedisCacheService:
    """
    Gestor asíncrono de caché en Redis de dos niveles (Fresh TTL + Stale-If-Error)
    utilizando exclusivamente datos reales provenientes del proveedor externo.
    """

    SPORTS_FRESH_KEY = "betmetrics:sports:fresh"
    SPORTS_STALE_KEY = "betmetrics:sports:stale"

    def __init__(self) -> None:
        self._redis_client: Optional[redis.Redis] = None

    async def _get_client(self) -> Optional[redis.Redis]:
        if self._redis_client is None:
            try:
                client = redis.from_url(
                    settings.REDIS_URL,
                    encoding="utf-8",
                    decode_responses=True,
                    socket_connect_timeout=1.5,
                    socket_timeout=1.5,
                )
                await client.ping()
                self._redis_client = client
            except Exception as exc:
                logger.warning("Redis connection unavailable (%s).", repr(exc))
                self._redis_client = None
        return self._redis_client

    @staticmethod
    def _build_fresh_key(sport: str) -> str:
        return f"betmetrics:odds:fresh:{sport}"

    @staticmethod
    def _build_stale_key(sport: str) -> str:
        return f"betmetrics:odds:stale:{sport}"

    async def _read_json(self, key: str) -> Optional[Any]:
        client = await self._get_client()
        if client is None:
            return None
        try:
            raw_data = await client.get(key)
            if raw_data is not None:
                return json.loads(raw_data)
        except Exception as exc:
            logger.warning("Failed reading key=%s from Redis (%s).", key, repr(exc))
            self._redis_client = None
        return None

    async def _write_json(self, key: str, value: Any, ttl_seconds: int) -> None:
        client = await self._get_client()
        if client is None:
            return
        try:
            await client.setex(key, ttl_seconds, json.dumps(value))
        except Exception as exc:
            logger.warning("Failed writing key=%s to Redis (%s).", key, repr(exc))
            self._redis_client = None

    async def get_fresh_odds(self, sport: str) -> Optional[List[Dict[str, Any]]]:
        """Devuelve cuotas reales dentro de la ventana fresca (ej. 5 minutos)."""
        return await self._read_json(self._build_fresh_key(sport))

    async def get_stale_odds(self, sport: str) -> Optional[List[Dict[str, Any]]]:
        """Devuelve la última captura real guardada cuando RapidAPI responde 429 o falla."""
        return await self._read_json(self._build_stale_key(sport))

    async def set_odds(
        self, sport: str, data: List[Dict[str, Any]], ttl_seconds: Optional[int] = None
    ) -> None:
        """Almacena la respuesta real tanto en caché fresca como en respaldo Stale-If-Error."""
        fresh_ttl = ttl_seconds or settings.CACHE_TTL_SECONDS
        stale_ttl = max(settings.STALE_CACHE_TTL_SECONDS, fresh_ttl)
        await self._write_json(self._build_fresh_key(sport), data, fresh_ttl)
        await self._write_json(self._build_stale_key(sport), data, stale_ttl)

    async def invalidate_odds(self, sport: str) -> bool:
        """Invalida la caché fresca para forzar una petición real inmediata a RapidAPI."""
        client = await self._get_client()
        if client is None:
            return False
        try:
            deleted_count = await client.delete(self._build_fresh_key(sport))
            return deleted_count > 0
        except Exception as exc:
            logger.warning("Failed deleting fresh key in Redis (%s).", repr(exc))
            self._redis_client = None
            return False

    async def get_fresh_sports(self) -> Optional[List[Dict[str, str]]]:
        return await self._read_json(self.SPORTS_FRESH_KEY)

    async def get_stale_sports(self) -> Optional[List[Dict[str, str]]]:
        return await self._read_json(self.SPORTS_STALE_KEY)

    async def set_sports(self, sports: List[Dict[str, str]]) -> None:
        await self._write_json(
            self.SPORTS_FRESH_KEY, sports, settings.SPORTS_CACHE_TTL_SECONDS
        )
        await self._write_json(
            self.SPORTS_STALE_KEY, sports, settings.STALE_CACHE_TTL_SECONDS
        )


redis_cache_service = RedisCacheService()
