from fastapi import APIRouter
from app.api.v1.endpoints import admin, auth, bets, calculation, odds

api_v1_router = APIRouter()

api_v1_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_v1_router.include_router(bets.router, prefix="/bets", tags=["Paper Betting"])
api_v1_router.include_router(odds.router, prefix="/odds", tags=["Odds & +EV Feed"])
api_v1_router.include_router(
    calculation.router, prefix="/calculations", tags=["+EV Calculator Engine"]
)
api_v1_router.include_router(
    admin.router, prefix="/admin", tags=["Administration & Cache Control"]
)

