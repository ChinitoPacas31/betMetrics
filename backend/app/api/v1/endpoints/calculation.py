from fastapi import APIRouter, status
from app.schemas.ev_schemas import EVCalculationRequest, EVCalculationResponse
from app.services.ev_calculator import EVCalculatorService

router = APIRouter()


@router.post(
    "/ev",
    response_model=EVCalculationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Calcular manualmente el Valor Esperado (+EV) y semáforo de una apuesta",
)
async def calculate_custom_ev(
    payload: EVCalculationRequest,
) -> EVCalculationResponse:
    """
    Calcula el Valor Esperado (+EV), probabilidad implícita, beneficio potencial y
    asigna el semáforo de confianza (GREEN, YELLOW, RED) validando estrictamente
    que el stake sea > 0 y la probabilidad real esté en el rango (0, 1).
    """
    return EVCalculatorService.calculate_ev(payload)

