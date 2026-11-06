import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, utcnow

if TYPE_CHECKING:
    from app.models.user import User


class PaperBet(Base):
    __tablename__ = "paper_bets"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    match_id: Mapped[str] = mapped_column(String(128))
    match_name: Mapped[str] = mapped_column(String(255))
    league: Mapped[str] = mapped_column(String(160))
    selection: Mapped[str] = mapped_column(String(160))
    outcome_key: Mapped[str] = mapped_column(String(16))
    bookmaker: Mapped[str] = mapped_column(String(120))
    decimal_odds: Mapped[Decimal] = mapped_column(Numeric(10, 3))
    implied_probability: Mapped[Decimal] = mapped_column(Numeric(8, 4))
    true_probability: Mapped[Decimal] = mapped_column(Numeric(8, 4))
    stake: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    potential_profit: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    expected_value: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    ev_percentage: Mapped[Decimal] = mapped_column(Numeric(8, 2))
    traffic_light: Mapped[str] = mapped_column(String(10))
    status: Mapped[str] = mapped_column(String(10), default="PENDING", index=True)
    placed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, index=True
    )
    settled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    user: Mapped["User"] = relationship(back_populates="bets")
