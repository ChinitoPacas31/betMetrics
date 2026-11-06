import asyncio
import logging
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings
from app.models.base import Base

logger = logging.getLogger("betmetrics.database")

if not settings.DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not configured. Set it to a PostgreSQL async URL, "
        "e.g. postgresql+asyncpg://betmetrics:<password>@db:5432/betmetrics."
    )


engine = create_async_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependencia FastAPI que entrega una sesión y garantiza su cierre."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


async def init_db(max_attempts: int = 10, delay_seconds: float = 1.0) -> None:
    """Crea las tablas al arrancar, reintentando mientras PostgreSQL termina de iniciar."""
    from app import models  # noqa: F401  (registra los modelos en Base.metadata)

    for attempt in range(1, max_attempts + 1):
        try:
            async with engine.begin() as connection:
                await connection.run_sync(Base.metadata.create_all)
            logger.info("PostgreSQL schema ready.")
            return
        except Exception as exc:  # pragma: no cover - depende del entorno
            if attempt == max_attempts:
                logger.error("Could not initialize PostgreSQL after %s attempts.", attempt)
                raise
            logger.warning(
                "PostgreSQL not ready (attempt %s/%s): %s. Retrying...",
                attempt,
                max_attempts,
                repr(exc),
            )
            await asyncio.sleep(delay_seconds)


async def close_db() -> None:
    await engine.dispose()
