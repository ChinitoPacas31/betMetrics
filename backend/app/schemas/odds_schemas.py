from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.ev_schemas import TrafficLightColor


class MarketOutcomeEVItem(BaseModel):
    """Representa una celda individual de momio (1, X o 2) con su análisis +EV."""

    key: str = Field(..., description="Clave corta de columna: '1', 'X' o '2'")
    selection: str = Field(..., description="Nombre legible de la selección")
    bookmaker: str = Field(..., description="Casa con la mejor cuota detectada")
    decimal_odds: float
    implied_probability: float
    true_probability: float
    stake: float
    potential_profit: float
    expected_value: float
    ev_percentage: float
    traffic_light: TrafficLightColor
    recommendation: str


class MatchOddsEVItem(BaseModel):
    """Representa un partido completo con su mejor línea +EV y las celdas 1-X-2 / H2H."""

    match_id: str
    sport_key: str
    league: str
    country: str = ""
    market_type: str = "h2h_3way"
    bookmakers_count: int = 1
    home_team: str
    away_team: str
    home_team_logo: Optional[str] = None
    away_team_logo: Optional[str] = None
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
    outcomes: List[MarketOutcomeEVItem] = Field(default_factory=list)


class OddsEVListResponse(BaseModel):
    """Respuesta del listado de cuotas +EV con metadatos de caché y origen real."""

    sport: str
    cached: bool = Field(
        ..., description="Indica si los datos provienen de Redis (TTL fresco o respaldo Stale-If-Error)"
    )
    source: str = Field(
        ...,
        description="Origen real de datos: rapidapi_live | redis_cache | redis_stale_429 | redis_stale_error",
    )
    count: int
    timestamp: datetime
    items: List[MatchOddsEVItem]


class SportCatalogItem(BaseModel):
    """Deporte/liga activa obtenida dinámicamente desde RapidAPI."""

    sport_key: str
    title: str
    category: str
    country: str
    market_type: str


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
        description="Si es True, invalida la clave fresca en Redis antes de consultar RapidAPI",
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
