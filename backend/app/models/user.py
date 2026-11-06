import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Numeric, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, utcnow

if TYPE_CHECKING:
    from app.models.paper_bet import PaperBet


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[str] = mapped_column(String(80))
    is_active: Mapped[bool] = mapped_column(default=True)
    starting_bankroll: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), default=Decimal("10000.00")
    )
    odds_format: Mapped[str] = mapped_column(String(10), default="DECIMAL")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )

    bets: Mapped[list["PaperBet"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
