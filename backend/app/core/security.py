import secrets
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.config import settings

# auto_error=False permite capturar la ausencia del header y devolver siempre 401 semántico
bearer_scheme = HTTPBearer(auto_error=False)


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

