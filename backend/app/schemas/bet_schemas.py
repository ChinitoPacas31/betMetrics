from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PaperBetCreate(BaseModel):
    match_id: str = Field(..., min_length=1, max_length=128)
    match_name: str = Field(..., min_length=1, max_length=255)
    league: str = Field(..., min_length=1, max_length=160)
    selection: str = Field(..., min_length=1, max_length=160)
    outcome_key: str = Field(..., min_length=1, max_length=16)
    bookmaker: str = Field(..., min_length=1, max_length=120)
    decimal_odds: float = Field(..., gt=1.0, le=1000.0)
    true_probability: float = Field(..., gt=0.0, lt=1.0)
    stake: float = Field(..., gt=0.0, le=1_000_000.0)

    model_config = ConfigDict(extra="forbid")


class PaperBetStatusUpdate(BaseModel):
    status: Literal["PENDING", "WON", "LOST", "PUSH"]

    model_config = ConfigDict(extra="forbid")


class PaperBetResponse(BaseModel):
    id: UUID
    placed_at: datetime
    settled_at: Optional[datetime]
    match_id: str
    match_name: str
    league: str
    selection: str
    outcome_key: str
    bookmaker: str
    decimal_odds: float
    implied_probability: float
    true_probability: float
    stake: float
    potential_profit: float
    expected_value: float
    ev_percentage: float
    traffic_light: str
    status: str

    model_config = ConfigDict(from_attributes=True)
