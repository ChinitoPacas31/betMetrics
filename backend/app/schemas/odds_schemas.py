from datetime import datetime
from typing import List
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.ev_schemas import TrafficLightColor


class MatchOddsEVItem(BaseModel):
    """Representa un partido con su cuota, probabilidad estimada y semáforo +EV."""

    match_id: str
    sport_key: str
    league: str
    home_team: str
    away_team: str
    commence_time: str
    bookmaker: str
    selection: str
    decimal_odds: float
    implied_probability: float
    true_probability: float
    stake: float
    potential_profit: float
    expected_value: float
    ev_percentage: float
    traffic_light: TrafficLightColor
    recommendation: str


class OddsEVListResponse(BaseModel):
    """Respuesta del listado de cuotas +EV con metadatos de caché y origen."""

    sport: str
    cached: bool = Field(
        ..., description="Indica si los datos provienen de Redis/Caché por fallback o TTL"
    )
    source: str = Field(
        ..., description="Origen de datos: rapidapi_live | redis_cache | resilient_fallback"
    )
    count: int
    timestamp: datetime
    items: List[MatchOddsEVItem]


class SyncOddsRequest(BaseModel):
    """Cuerpo opcional para el endpoint administrativo de sincronización."""

    sport: str = Field(
        default="soccer_epl",
        min_length=2,
        max_length=64,
        description="Identificador del deporte a sincronizar",
    )
    force_invalidate: bool = Field(
        default=True,
        description="Si es True, invalida la clave en Redis antes de consultar RapidAPI",
    )

    model_config = ConfigDict(extra="forbid")


class SyncOddsResponse(BaseModel):
    """Respuesta de sincronización administrativa de cuotas."""

    status: str
    sport: str
    cache_invalidated: bool
    synced_matches: int
    source: str
    timestamp: datetime

