import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import PaperBet, User
from app.schemas.bet_schemas import (
    PaperBetCreate,
    PaperBetResponse,
    PaperBetStatusUpdate,
)
from app.schemas.ev_schemas import EVCalculationRequest
from app.services.ev_calculator import EVCalculatorService

router = APIRouter()


def _available_bankroll(user: User, bets: list[PaperBet]) -> float:
    pending = 0.0
    realized = 0.0
    for bet in bets:
        stake = float(bet.stake)
        if bet.status == "PENDING":
            pending += stake
        elif bet.status == "WON":
            realized += float(bet.potential_profit)
        elif bet.status == "LOST":
            realized -= stake
    return round(float(user.starting_bankroll) + realized - pending, 2)


async def _get_owned_bet(
    bet_id: uuid.UUID, user: User, db: AsyncSession
) -> PaperBet:
    bet = await db.scalar(
        select(PaperBet).where(
            PaperBet.id == bet_id,
            PaperBet.user_id == user.id,
        )
    )
    if bet is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paper bet not found.",
        )
    return bet


@router.get(
    "",
    response_model=list[PaperBetResponse],
    summary="Listar los paper bets del usuario autenticado",
)
async def list_paper_bets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[PaperBetResponse]:
    bets = await db.scalars(
        select(PaperBet)
        .where(PaperBet.user_id == current_user.id)
        .order_by(PaperBet.placed_at.desc())
    )
    return [PaperBetResponse.model_validate(bet) for bet in bets]


@router.post(
    "",
    response_model=PaperBetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un paper bet calculado por el motor +EV",
)
async def create_paper_bet(
    payload: PaperBetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PaperBetResponse:
    existing_bets = list(
        await db.scalars(
            select(PaperBet).where(PaperBet.user_id == current_user.id)
        )
    )
    available = _available_bankroll(current_user, existing_bets)
    if payload.stake > available + 0.01:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient available bankroll (${available:.2f}).",
        )

    calculation = EVCalculatorService.calculate_ev(
        EVCalculationRequest(
            match_name=payload.match_name,
            decimal_odds=payload.decimal_odds,
            true_probability=payload.true_probability,
            stake=payload.stake,
        )
    )

    bet = PaperBet(
        user_id=current_user.id,
        match_id=payload.match_id,
        match_name=payload.match_name,
        league=payload.league,
        selection=payload.selection,
        outcome_key=payload.outcome_key,
        bookmaker=payload.bookmaker,
        decimal_odds=calculation.decimal_odds,
        implied_probability=calculation.implied_probability,
        true_probability=calculation.true_probability,
        stake=calculation.stake,
        potential_profit=calculation.potential_profit,
        expected_value=calculation.expected_value,
        ev_percentage=calculation.ev_percentage,
        traffic_light=calculation.traffic_light.value,
        status="PENDING",
    )
    db.add(bet)
    await db.commit()
    await db.refresh(bet)
    return PaperBetResponse.model_validate(bet)


@router.patch(
    "/{bet_id}",
    response_model=PaperBetResponse,
    summary="Liquidar un paper bet como WON, LOST, PUSH o volver a PENDING",
)
async def update_paper_bet(
    bet_id: uuid.UUID,
    payload: PaperBetStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PaperBetResponse:
    bet = await _get_owned_bet(bet_id, current_user, db)
    bet.status = payload.status
    bet.settled_at = (
        None
        if payload.status == "PENDING"
        else datetime.now(timezone.utc)
    )
    await db.commit()
    await db.refresh(bet)
    return PaperBetResponse.model_validate(bet)


@router.delete(
    "/{bet_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar un paper bet del usuario autenticado",
)
async def delete_paper_bet(
    bet_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    bet = await _get_owned_bet(bet_id, current_user, db)
    await db.delete(bet)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete(
    "",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar todo el historial de paper bets del usuario",
)
async def delete_all_paper_bets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    await db.execute(delete(PaperBet).where(PaperBet.user_id == current_user.id))
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
