from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    display_name: str = Field(..., min_length=2, max_length=80)

    model_config = ConfigDict(extra="forbid")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)

    model_config = ConfigDict(extra="forbid")


class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = Field(default=None, min_length=2, max_length=80)
    starting_bankroll: Optional[float] = Field(
        default=None, ge=100.0, le=10_000_000.0
    )
    odds_format: Optional[Literal["DECIMAL", "AMERICAN"]] = None

    model_config = ConfigDict(extra="forbid")


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    display_name: str
    starting_bankroll: float
    odds_format: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
