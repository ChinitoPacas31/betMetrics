import json
import logging
from typing import Any, Dict, List, Optional
import redis.asyncio as redis
from app.core.config import settings

logger = logging.getLogger("betmetrics.cache")


class RedisCacheService:
    """
    Gestor asíncrono de caché en Redis con fallback en memoria local
    para garantizar alta disponibilidad durante el desarrollo o caídas del nodo Redis.
    """

    def __init__(self) -> None:
        self._redis_client: Optional[redis.Redis] = None
        self._memory_fallback: Dict[str, str] = {}

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
                logger.warning("Redis connection unavailable (%s), using in-memory fallback.", repr(exc))
                self._redis_client = None
        return self._redis_client

    @staticmethod
    def _build_key(sport: str) -> str:
        return f"betmetrics:odds:{sport}"

    async def get_odds(self, sport: str) -> Optional[List[Dict[str, Any]]]:
        key = self._build_key(sport)
        client = await self._get_client()
        if client is not None:
            try:
                raw_data = await client.get(key)
                if raw_data:
                    return json.loads(raw_data)
            except Exception as exc:
                logger.warning("Failed reading from Redis (%s), checking memory fallback.", repr(exc))

        if key in self._memory_fallback:
            return json.loads(self._memory_fallback[key])
        return None

    async def set_odds(
        self, sport: str, data: List[Dict[str, Any]], ttl_seconds: Optional[int] = None
    ) -> None:
        key = self._build_key(sport)
        ttl = ttl_seconds or settings.CACHE_TTL_SECONDS
        serialized = json.dumps(data)

        # Guardar siempre en memoria de respaldo para resiliencia ante fallos
        self._memory_fallback[key] = serialized

        client = await self._get_client()
        if client is not None:
            try:
                await client.setex(key, ttl, serialized)
            except Exception as exc:
                logger.warning("Failed writing to Redis (%s), stored in memory fallback.", repr(exc))

    async def invalidate_odds(self, sport: str) -> bool:
        key = self._build_key(sport)
        removed_memory = self._memory_fallback.pop(key, None) is not None
        removed_redis = False

        client = await self._get_client()
        if client is not None:
            try:
                deleted_count = await client.delete(key)
                removed_redis = deleted_count > 0
            except Exception as exc:
                logger.warning("Failed deleting key in Redis (%s).", repr(exc))

        return removed_redis or removed_memory


redis_cache_service = RedisCacheService()

