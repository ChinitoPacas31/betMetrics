import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models import User

# auto_error=False permite capturar la ausencia del header y devolver siempre 401 semántico
bearer_scheme = HTTPBearer(auto_error=False)
password_hasher = PasswordHash.recommended()

CREDENTIALS_DETAIL = "Could not validate credentials."


def credentials_exception() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=CREDENTIALS_DETAIL,
        headers={"WWW-Authenticate": "Bearer"},
    )


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return password_hasher.verify(password, password_hash)


def create_access_token(user_id: uuid.UUID) -> str:
    signing_key = settings.jwt_signing_key
    if not signing_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Authentication is not configured. Set JWT_SECRET_KEY "
                "(or API_SECRET_TOKEN) in the environment."
            ),
        )

    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, signing_key, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    signing_key = settings.jwt_signing_key
    if not signing_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication is not configured on the server.",
        )

    try:
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except jwt.PyJWTError as exc:
        raise credentials_exception() from exc

    if payload.get("type") != "access":
        raise credentials_exception()
    return payload


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise credentials_exception()

    payload = decode_access_token(credentials.credentials)
    try:
        user_id = uuid.UUID(str(payload.get("sub")))
    except (TypeError, ValueError) as exc:
        raise credentials_exception() from exc

    user = await db.scalar(select(User).where(User.id == user_id))
    if user is None or not user.is_active:
        raise credentials_exception()
    return user


async def verify_admin_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> str:
    """
    Valida el token Bearer administrativo en tiempo constante para prevenir Timing Attacks.
    Rechaza con 401 Unauthorized si no se suministra o si es inválido.
    """
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization Bearer header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    provided_token = credentials.credentials
    expected_token = settings.API_SECRET_TOKEN

    if not expected_token or not secrets.compare_digest(provided_token, expected_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrative access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return provided_token
