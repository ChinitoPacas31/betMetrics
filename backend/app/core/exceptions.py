import logging
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("betmetrics.security")


class ExternalServiceUnavailableError(Exception):
    """Excepción lanzada cuando RapidAPI y el fallback de caché no están disponibles."""

    def __init__(self, message: str = "External odds provider and cache are currently unavailable."):
        self.message = message
        super().__init__(self.message)


def register_exception_handlers(app: FastAPI) -> None:
    """
    Registra manejadores globales de excepciones para cumplir con OWASP
    (Mishandling of Exceptional Conditions), garantizando que jamás se filtren
    stack traces ni detalles internos de Python al cliente.
    """

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        sanitized_errors = []
        for err in exc.errors():
            field_path = " -> ".join(str(loc) for loc in err.get("loc", []))
            sanitized_errors.append(
                {
                    "field": field_path,
                    "message": err.get("msg", "Invalid value"),
                }
            )
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error": "BadRequest",
                "message": "Invalid request payload or parameters.",
                "details": sanitized_errors,
            },
        )

    @app.exception_handler(ExternalServiceUnavailableError)
    async def external_service_unavailable_handler(
        request: Request, exc: ExternalServiceUnavailableError
    ) -> JSONResponse:
        logger.warning("Service Unavailable on %s: %s", request.url.path, exc.message)
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": "ServiceUnavailable",
                "message": exc.message,
            },
        )

    @app.exception_handler(HTTPException)
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: HTTPException
    ) -> JSONResponse:
        error_map = {
            status.HTTP_400_BAD_REQUEST: "BadRequest",
            status.HTTP_401_UNAUTHORIZED: "Unauthorized",
            status.HTTP_403_FORBIDDEN: "Forbidden",
            status.HTTP_404_NOT_FOUND: "NotFound",
            status.HTTP_409_CONFLICT: "Conflict",
            status.HTTP_429_TOO_MANY_REQUESTS: "TooManyRequests",
            status.HTTP_503_SERVICE_UNAVAILABLE: "ServiceUnavailable",
        }
        error_name = error_map.get(exc.status_code, "HTTPException")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": error_name,
                "message": str(exc.detail),
            },
            headers=getattr(exc, "headers", None),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        # Se registra internamente en consola/logs del servidor pero jamás se envía al cliente
        logger.error("Unhandled internal error on %s: %s", request.url.path, repr(exc))
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "InternalServerError",
                "message": "An unexpected error occurred.",
            },
        )

