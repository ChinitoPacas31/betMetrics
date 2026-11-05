from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Body, Depends, status
from app.core.security import verify_admin_token
from app.schemas.odds_schemas import SyncOddsRequest, SyncOddsResponse
from app.services.rapidapi_client import rapidapi_client_service
from app.services.redis_cache import redis_cache_service

router = APIRouter()


@router.post(
    "/sync-odds",
    response_model=SyncOddsResponse,
    status_code=status.HTTP_200_OK,
    summary="Forzar invalidación de caché en Redis y resincronización de cuotas (Protegido)",
)
async def sync_odds_cache(
    payload: Optional[SyncOddsRequest] = Body(default=None),
    _token: str = Depends(verify_admin_token),
) -> SyncOddsResponse:
    """
    Endpoint administrativo protegido por HTTPBearer.
    1. Rechaza con 401 Unauthorized si no se incluye un token Bearer válido.
    2. Invalida la caché fresca en Redis para el deporte solicitado.
    3. Fuerza la consulta en vivo hacia RapidAPI (o informa si se preservó el respaldo Stale en caso de 429).
    """
    request_data = payload or SyncOddsRequest()
    cache_invalidated = False

    if request_data.force_invalidate:
        cache_invalidated = await redis_cache_service.invalidate_odds(request_data.sport)

    matches, _is_cached, source = await rapidapi_client_service.fetch_matches_with_resilience(
        sport=request_data.sport,
        force_refresh=True,
    )

    sync_status = (
        "stale_cache_preserved" if source.startswith("redis_stale") else "synchronized"
    )

    return SyncOddsResponse(
        status=sync_status,
        sport=request_data.sport,
        cache_invalidated=cache_invalidated,
        synced_matches=len(matches),
        source=source,
        timestamp=datetime.now(timezone.utc),
    )
