from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class TrafficLightColor(str, Enum):
    GREEN = "GREEN"
    YELLOW = "YELLOW"
    RED = "RED"


class EVCalculationRequest(BaseModel):
    """Esquema de entrada con validación estricta para cálculo de Valor Esperado (+EV)."""

    match_name: Optional[str] = Field(
        default="Custom Simulation Match",
        min_length=2,
        max_length=120,
        description="Nombre del evento deportivo a simular",
    )
    decimal_odds: float = Field(
        ...,
        gt=1.0,
        le=1000.0,
        description="Cuota en formato decimal (debe ser estrictamente mayor a 1.0)",
    )
    true_probability: float = Field(
        ...,
        gt=0.0,
        lt=1.0,
        description="Probabilidad real estimada del evento entre 0 y 1 (exclusivo)",
    )
    stake: float = Field(
        ...,
        gt=0.0,
        le=1_000_000.0,
        description="Monto a apostar (Paper Betting Stake, estrictamente positivo)",
    )

    model_config = ConfigDict(extra="forbid")


class EVCalculationResponse(BaseModel):
    """Respuesta enriquecida del motor matemático +EV."""

    match_name: str
    decimal_odds: float
    true_probability: float
    implied_probability: float = Field(
        ..., description="Probabilidad implícita de la casa de apuestas (1 / decimal_odds)"
    )
    stake: float
    potential_profit: float = Field(
        ..., description="Ganancia neta potencial si la apuesta resulta ganadora"
    )
    expected_value: float = Field(
        ..., description="Valor Esperado monetario: (P_win * Profit) - (P_loss * Stake)"
    )
    ev_percentage: float = Field(
        ..., description="Porcentaje de Valor Esperado sobre el Stake: (EV / Stake) * 100"
    )
    traffic_light: TrafficLightColor = Field(
        ..., description="Semáforo de confianza: GREEN (>3%), YELLOW (0-3%), RED (<0%)"
    )
    recommendation: str

