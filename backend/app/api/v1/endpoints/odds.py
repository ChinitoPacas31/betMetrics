from fastapi import APIRouter, Query, status
from app.schemas.odds_schemas import OddsEVListResponse
from app.services.rapidapi_client import rapidapi_client_service

router = APIRouter()


@router.get(
    "/ev",
    response_model=OddsEVListResponse,
    status_code=status.HTTP_200_OK,
    summary="Obtener cuotas deportivas analizadas con Valor Esperado (+EV)",
)
async def get_odds_ev(
    sport: str = Query(
        default="soccer_epl",
        min_length=2,
        max_length=64,
        description="Identificador del deporte o liga (ej. soccer_epl)",
    ),
    stake: float = Query(
        default=100.0,
        gt=0.0,
        le=1_000_000.0,
        description="Stake base para simulación de Paper Betting",
    ),
) -> OddsEVListResponse:
    """
    Retorna la lista de eventos deportivos con cuotas analizadas por el motor matemático +EV.
    Si RapidAPI excede el límite (429) o presenta timeout, retorna automáticamente los datos
    cacheados en Redis con `"cached": true`.
    """
    return await rapidapi_client_service.get_odds_with_ev(sport=sport, stake=stake)

