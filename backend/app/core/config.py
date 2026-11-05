from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración centralizada y validada mediante variables de entorno."""

    PORT: int = 8000
    ENVIRONMENT: str = "development"
    API_SECRET_TOKEN: str = ""
    RAPIDAPI_KEY: str = ""
    RAPIDAPI_HOST: str = "odds.p.rapidapi.com"
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL_SECONDS: int = 300
    STALE_CACHE_TTL_SECONDS: int = 86400
    SPORTS_CACHE_TTL_SECONDS: int = 3600
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
