# BetMetrics — Plataforma de Análisis Deportivo (+EV) y Paper Betting

**BetMetrics** es una arquitectura desacoplada compuesta por un microservicio REST en **FastAPI (Python)**, caché autenticada en **Redis 7**, y un cliente web en **Next.js (App Router + TypeScript + Tailwind CSS)**. El sistema calcula el Valor Esperado (**+EV**) de cuotas deportivas en tiempo real, clasifica el nivel de confianza mediante un semáforo estadístico, gestiona fallback resiliente ante caídas o límites de cuota (HTTP 429) de **RapidAPI**, y cumple con controles estrictos de seguridad (OWASP A02:2025 y Mishandling of Exceptional Conditions).

---

## Arquitectura y Estructura del Proyecto

```text
betMetrics/
├── .gitignore
├── .dockerignore
├── docker-compose.yml
├── README.md
├── tests.http
├── backend/
│   ├── .env.example
│   ├── .dockerignore
│   ├── requirements.txt
│   ├── Dockerfile
│   └── app/
│       ├── __init__.py
│       ├── main.py
│       ├── core/
│       │   ├── __init__.py
│       │   ├── config.py
│       │   ├── security.py
│       │   └── exceptions.py
│       ├── schemas/
│       │   ├── __init__.py
│       │   ├── ev_schemas.py
│       │   └── odds_schemas.py
│       ├── services/
│       │   ├── __init__.py
│       │   ├── ev_calculator.py
│       │   ├── redis_cache.py
│       │   └── rapidapi_client.py
│       └── api/
│           ├── __init__.py
│           └── v1/
│               ├── __init__.py
│               ├── router.py
│               └── endpoints/
│                   ├── __init__.py
│                   ├── odds.py
│                   ├── calculation.py
│                   └── admin.py
└── frontend/
    ├── .env.example
    ├── next-env.d.ts
    ├── package.json
    ├── tsconfig.json
    ├── postcss.config.js
    ├── tailwind.config.ts
    ├── next.config.js
    └── src/
        ├── app/
        │   ├── globals.css
        │   ├── layout.tsx
        │   ├── page.tsx
        │   └── calculator/
        │       └── page.tsx
        ├── components/
        │   ├── Navbar.tsx
        │   ├── MatchCard.tsx
        │   ├── TrafficLightBadge.tsx
        │   └── EVCalculatorForm.tsx
        ├── lib/
        │   └── api.ts
        └── types/
            └── index.ts
```

---

## Quick Start / Cómo Ejecutar (Flujo Híbrido: Docker + Frontend Local)

Para facilitar la evaluación sin necesidad de instalar ni configurar Python o Redis manualmente en el host, el proyecto utiliza un esquema híbrido donde la infraestructura y el microservicio corren en contenedores Docker y el cliente Next.js se ejecuta localmente.

### Paso 1: Servicios Backend e Infraestructura en Docker (`Redis` + `FastAPI`)

Desde la raíz del repositorio:

```bash
# Copiar variables de entorno base si no existen
cp backend/.env.example backend/.env

# Levantar Redis y FastAPI
docker compose up --build -d
```

- **Documentación interactiva (Swagger UI):** `http://localhost:8000/docs`
- **Chequeo de salud (Healthcheck):** `http://localhost:8000/health`

### Paso 2: Cliente Web Next.js (`frontend/`)

En una nueva terminal:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

- **Interfaz Web (Dashboard +EV y Calculadora Paper Betting):** `http://localhost:3000`

> **Nota (Ejecución 100% en Docker):** Si prefieres levantar también el frontend dentro de Docker sin usar Node.js local, solo debes descomentar el bloque `frontend:` en `docker-compose.yml` y ejecutar `docker compose up --build`.

---

## Ejecución de la Suite de Pruebas (`tests.http`)

Con el Paso 1 activo en `http://localhost:8000`, abre el archivo `tests.http` en VS Code con la extensión **REST Client** (`humao.rest-client`) y haz clic en **"Send Request"** sobre cada caso de prueba:

1. `GET /health` -> `200 OK` (`{"status": "healthy", "service": "betmetrics-microservice", "timestamp": "..."}`).
2. `GET /api/v1/odds/ev` -> `200 OK` (Listado de cuotas con cálculo +EV, semáforo y bandera `"cached": true/false`).
3. `POST /api/v1/calculations/ev` (Datos válidos) -> `201 Created` (Simulación Paper Betting con semáforo).
4. `POST /api/v1/calculations/ev` (Datos inválidos: `stake < 0`, `true_probability > 1`) -> `400 Bad Request` (Validación Pydantic sin filtrar stack trace).
5. `POST /api/v1/admin/sync-odds` (Sin header `Authorization`) -> `401 Unauthorized`.
6. `POST /api/v1/admin/sync-odds` (Con `Authorization: Bearer betmetrics-super-secret-admin-token-2026`) -> `200 OK`.

---

## Modelo Matemático (+EV y Semáforo de Confianza)

Para una cuota decimal $O$, probabilidad real estimada $P_{\text{win}} \in (0, 1)$, probabilidad de pérdida $P_{\text{loss}} = 1 - P_{\text{win}}$ y monto apostado $\text{Stake}$:

$$\text{Profit} = \text{Stake} \times (O - 1)$$

$$\text{EV} = (P_{\text{win}} \times \text{Profit}) - (P_{\text{loss}} \times \text{Stake})$$

$$\text{EV\%} = \left(\frac{\text{EV}}{\text{Stake}}\right) \times 100$$

| Color Semáforo | Condición Matemática | Clasificación |
| :--- | :--- | :--- |
| **GREEN** (`GREEN`) | $\text{EV\%} > 3.0\%$ | Valor Esperado Positivo Alto (+EV) |
| **YELLOW** (`YELLOW`) | $0.0\% \le \text{EV\%} \le 3.0\%$ | Zona Neutral / Margen Bajo |
| **RED** (`RED`) | $\text{EV\%} < 0.0\%$ | Valor Esperado Negativo / Alto Riesgo |

---

## Especificación de Endpoints REST (`api/v1` y `/health`)

| Método HTTP | Ruta | Headers Requeridos | Query Params / Body (JSON) | Respuesta Exitosa | Códigos de Estado y Errores |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | Ninguno (Público) | Ninguno | **200 OK**: `{"status": "healthy", "service": "betmetrics-microservice", "timestamp": "ISO-8601-UTC"}` | `200 OK`: Servicio operativo para Docker Healthcheck. |
| `GET` | `/api/v1/odds/ev` | `Accept: application/json` | **Query (opcional):** `sport` (default: `soccer_epl`), `stake` (default: `100.0`, $>0$) | **200 OK**: Lista de eventos con cuotas analizadas, `ev_percentage`, `traffic_light` y bandera `"cached": bool`. | `200 OK`: Cuotas obtenidas (API o fallback caché).<br>`400 Bad Request`: Parámetros de consulta fuera de rango.<br>`503 Service Unavailable`: RapidAPI falló/429 y no existe caché ni fallback disponible. |
| `POST` | `/api/v1/calculations/ev` | `Content-Type: application/json` | **Body:**<br>`{"match_name": "Arsenal vs Chelsea", "decimal_odds": 2.15, "true_probability": 0.52, "stake": 100.0}` | **201 Created**: Objeto con `expected_value`, `ev_percentage`, `implied_probability`, `potential_profit`, `traffic_light`, `recommendation`. | `201 Created`: Cálculo +EV procesado y registrado.<br>`400 Bad Request`: `stake <= 0`, `decimal_odds <= 1.0`, o `true_probability` fuera de $(0, 1)$.<br>`500 Internal Server Error`: Error interno sanitizado sin stack trace. |
| `POST` | `/api/v1/admin/sync-odds` | `Authorization: Bearer <API_SECRET_TOKEN>`<br>`Content-Type: application/json` | **Body (opcional):**<br>`{"sport": "soccer_epl", "force_invalidate": true}` | **200 OK**: Confirmación de invalidación de caché en Redis y resincronización con proveedor externo. | `200 OK`: Sincronización exitosa.<br>`400 Bad Request`: Payload malformado.<br>`401 Unauthorized`: Token Bearer ausente, formato inválido o token incorrecto.<br>`503 Service Unavailable`: Proveedor externo caído o límite 429 excedido durante sincronización forzada. |

---

## Controles de Seguridad Implementados (OWASP)

1. **Prevención de Fuga de Información (Mishandling of Exceptional Conditions)**:
   - Manejadores globales en `app/core/exceptions.py` y middleware de blindaje en `app/main.py` interceptan cualquier excepción no controlada y devuelven `{"error": "InternalServerError", "message": "An unexpected error occurred."}` (`500`), evitando que stack traces de Python lleguen al cliente.
2. **Hardening de Contenedores y Caché (OWASP A02:2025)**:
   - El contenedor de **Redis** exige contraseña (`--requirepass`) definida mediante variable de entorno.
   - El contenedor de **FastAPI** se ejecuta bajo un usuario del sistema sin privilegios (`appuser`, UID `1001`) y sin shell interactivo.
3. **Autenticación con Comparación en Tiempo Constante**:
   - El endpoint administrativo `/api/v1/admin/sync-odds` valida el token Bearer utilizando `secrets.compare_digest` para mitigar ataques de temporización (*Timing Attacks*).
