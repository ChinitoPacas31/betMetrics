from typing import List
from fastapi import APIRouter, Query, status
from app.schemas.odds_schemas import OddsEVListResponse, SportCatalogItem
from app.services.rapidapi_client import rapidapi_client_service

router = APIRouter()


@router.get(
    "/sports",
    response_model=List[SportCatalogItem],
    status_code=status.HTTP_200_OK,
    summary="Obtener catálogo dinámico de deportes y ligas activas en RapidAPI",
)
async def get_supported_sports() -> List[SportCatalogItem]:
    """Retorna el directorio real de deportes y ligas activas consultado desde RapidAPI y cacheado en Redis."""
    return await rapidapi_client_service.get_sports_catalog()


@router.get(
    "/ev",
    response_model=OddsEVListResponse,
    status_code=status.HTTP_200_OK,
    summary="Obtener cuotas deportivas reales analizadas con Valor Esperado (+EV)",
)
async def get_odds_ev(
    sport: str = Query(
        default="soccer_epl",
        min_length=2,
        max_length=64,
        description="Identificador real del deporte o liga en The Odds API (ej. soccer_mexico_ligamx, soccer_epl, basketball_nba)",
    ),
    stake: float = Query(
        default=100.0,
        gt=0.0,
        le=1_000_000.0,
        description="Stake base para simulación de Paper Betting",
    ),
) -> OddsEVListResponse:
    """
    Retorna la lista de eventos deportivos reales con cuotas analizadas por el motor matemático +EV.
    Si RapidAPI alcanza el límite de peticiones (HTTP 429) o presenta fallo temporal, sirve la última
    captura real almacenada en Redis (`redis_stale_429` / `redis_stale_error`); si no existe respaldo
    previo en Redis, responde honestamente con HTTP 503 Service Unavailable.
    """
    return await rapidapi_client_service.get_odds_with_ev(sport=sport, stake=stake)
