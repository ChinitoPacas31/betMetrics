# ==============================================================================
# BetMetrics Backend - Dockerfile de Producción Endurecido (Security Hardened)
# ==============================================================================
FROM python:3.12-slim

# Evitar escritura de bytecode (.pyc) y buffering en stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8000

WORKDIR /app

# Instalar dependencias mínimas del sistema (curl para healthcheck) y limpiar caché apt
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Crear grupo y usuario no privilegiado (sin permisos root ni shell interactivo)
RUN groupadd --system --gid 1001 appgroup && \
    useradd --system --uid 1001 --gid appgroup --no-create-home --shell /usr/sbin/nologin appuser

# Copiar e instalar dependencias de Python con caché deshabilitado
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente asignando propiedad al usuario no privilegiado
COPY --chown=appuser:appgroup ./app ./app

# Cambiar a usuario no privilegiado antes de exponer puertos o iniciar el proceso
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
