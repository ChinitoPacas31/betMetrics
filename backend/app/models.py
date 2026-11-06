import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


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
        DateTime(timezone=True), default=_utcnow
    )

    bets: Mapped[list["PaperBet"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


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
        DateTime(timezone=True), default=_utcnow, index=True
    )
    settled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    user: Mapped[User] = relationship(back_populates="bets")
