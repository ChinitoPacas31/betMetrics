from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.models import User
from app.schemas.auth_schemas import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UpdateProfileRequest,
    UserResponse,
)

router = APIRouter()


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una cuenta y devolver un token JWT",
)
async def register(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    email = payload.email.strip().lower()
    existing = await db.scalar(select(User).where(User.email == email))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        display_name=payload.display_name.strip(),
    )
    db.add(user)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        ) from exc

    await db.refresh(user)
    return AuthResponse(
        access_token=create_access_token(user.id),
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Iniciar sesión con email y contraseña",
)
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    email = payload.email.strip().lower()
    user = await db.scalar(select(User).where(User.email == email))
    if (
        user is None
        or not user.is_active
        or not verify_password(payload.password, user.password_hash)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return AuthResponse(
        access_token=create_access_token(user.id),
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Obtener el perfil del usuario autenticado",
)
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.patch(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Actualizar perfil, bankroll inicial o formato de momios",
)
async def update_me(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    updates = payload.model_dump(exclude_unset=True)
    if "display_name" in updates:
        updates["display_name"] = updates["display_name"].strip()

    for field, value in updates.items():
        setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)
