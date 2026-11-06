from datetime import datetime, timezone

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base declarativa compartida por todos los modelos SQLAlchemy."""


def utcnow() -> datetime:
    """Timestamp UTC usado por defecto en las columnas de auditoría."""
    return datetime.now(timezone.utc)
