import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_v1_router
from app.core.config import settings
from app.core.database import close_db, init_db
from app.core.exceptions import register_exception_handlers

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("betmetrics.main")


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    try:
        yield
    finally:
        await close_db()


def create_application() -> FastAPI:
    app = FastAPI(
        title="BetMetrics +EV Microservice API",
        description=(
            "Microservicio desacoplado para cálculo matemático de Valor Esperado (+EV), "
            "simulación Paper Betting y gestión de caché resiliente con Redis."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # Configuración CORS para permitir consumo desde el frontend Next.js
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Accept"],
    )

    # Middleware de seguridad adicional para interceptar fallos de bajo nivel
    # y añadir cabeceras de endurecimiento HTTP
    @app.middleware("http")
    async def security_and_exception_shield_middleware(request: Request, call_next):
        try:
            response = await call_next(request)
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["Cache-Control"] = "no-store"
            return response
        except Exception as exc:
            logger.error("Critical error caught by shield middleware: %s", repr(exc))
            return JSONResponse(
                status_code=500,
                content={
                    "error": "InternalServerError",
                    "message": "An unexpected error occurred.",
                },
            )

    # Registro de manejadores globales de excepciones (OWASP compliance)
    register_exception_handlers(app)

    # Ruta raíz informativa que redirige a la documentación interactiva Swagger
    @app.get(
        "/",
        tags=["Root"],
        summary="Redirección a la documentación interactiva",
        include_in_schema=False,
    )
    async def root():
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url="/docs")

    # Ruta pública de Healthcheck (exenta de autenticación Bearer y registrada antes de /api/v1)
    @app.get(
        "/health",
        status_code=status.HTTP_200_OK,
        tags=["Healthcheck"],
        summary="Comprobación de estado de salud del microservicio para Docker Healthcheck",
    )
    async def healthcheck():
        return {
            "status": "healthy",
            "service": "betmetrics-microservice",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    # Rutas versionadas principales de la API
    app.include_router(api_v1_router, prefix="/api/v1")

    return app


app = create_application()
