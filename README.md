# BetMetrics — Plataforma Cuantitativa de Análisis Deportivo (+EV) y Paper Betting

**BetMetrics** es una plataforma desacoplada de analítica cuantitativa deportiva (*Sportsbook Scanner +EV*) y simulador de gestión de portafolio (*Paper Betting*). Está compuesta por un microservicio REST asíncrono en **FastAPI (Python)**, una base de datos **PostgreSQL 16** para usuarios y paper bets, caché autenticada de dos niveles en **Redis 7**, y una interfaz tipo *Sportsbook* de tres columnas en **Next.js 14 (App Router + TypeScript + Tailwind CSS)**.

La plataforma incluye **registro/login con JWT y contraseñas hasheadas con Argon2**, y aísla el bankroll, las preferencias y el historial de boletos de cada usuario. El motor ingesta cuotas reales multi-casa desde **The Odds API (vía RapidAPI)** sin datos mockeados ni semillas hardcodeadas, elimina el margen oculto (*de-vigging*) ponderando casas institucionales (*sharp bookmakers*), identifica la mejor línea disponible por mercado (`1-X-2` / `H2H`), dimensiona el riesgo mediante el **Criterio de Kelly** y protege el consumo de API con una arquitectura resiliente **Stale-If-Error** ante límites de cuota (`HTTP 429`).

---

## Arquitectura y Estructura del Proyecto

```text
betMetrics/
├── .gitignore
├── .dockerignore
├── .env.example
├── docker-compose.yml
├── README.md
├── tests.http
├── backend/
│   ├── .dockerignore
│   ├── requirements.txt
│   ├── Dockerfile
│   └── app/
│       ├── main.py                     # App FastAPI, lifespan DB, CORS, headers HTTP y escudo OWASP
│       ├── models/
│       │   ├── __init__.py             # Exporta Base, User y PaperBet
│       │   ├── base.py                 # Base declarativa y utilidades ORM
│       │   ├── user.py                 # Modelo User
│       │   └── paper_bet.py            # Modelo PaperBet
│       ├── core/
│       │   ├── config.py               # Configuración tipada desde variables de entorno
│       │   ├── database.py             # Engine async, sesión y creación idempotente de tablas
│       │   ├── security.py             # JWT, Argon2 y validación Bearer Token
│       │   └── exceptions.py           # Sanitización global de errores (cero stack traces)
│       ├── schemas/
│       │   ├── auth_schemas.py         # Contratos de registro, login y perfil
│       │   ├── bet_schemas.py          # Contratos de paper bets
│       │   ├── ev_schemas.py           # Contratos Pydantic de cálculo +EV y semáforo
│       │   └── odds_schemas.py         # Contratos de catálogo dinámico, mercados y sync
│       ├── services/
│       │   ├── ev_calculator.py        # Motor matemático aislado de Valor Esperado (+EV)
│       │   ├── redis_cache.py          # Caché Redis de 2 niveles (Fresh TTL + Stale 24h)
│       │   └── rapidapi_client.py      # Cliente real RapidAPI, De-Vigging y Best-Line Shopping
│       └── api/v1/
│           ├── router.py
│           └── endpoints/
│               ├── auth.py             # Registro, login y perfil JWT
│               ├── bets.py             # CRUD de paper bets por usuario
│               ├── odds.py             # GET /odds/sports y GET /odds/ev
│               ├── calculation.py      # POST /calculations/ev
│               └── admin.py            # POST /admin/sync-odds (protegido)
└── frontend/
    ├── next.config.js                  # Carga de .env raíz y caché en RAM para Windows/OneDrive
    ├── tailwind.config.ts              # Sistema de color oscuro + Azul Eléctrico (#2563EB)
    ├── public/
    │   ├── logo.png                    # Isotipo oficial BM transparente
    │   ├── letras.png                  # Wordmark oficial BetMetrics transparente
    │   └── favicon.png                 # Favicon de pestaña de alto contraste
    └── src/
        ├── app/
        │   ├── layout.tsx              # Shell global, AuthProvider/AuthGate y metadatos/favicon
        │   ├── page.tsx                # Landing pública o Sportsbook de 3 columnas según sesión
        │   ├── login/page.tsx          # Inicio de sesión JWT
        │   ├── register/page.tsx       # Registro de cuenta
        │   ├── bets/page.tsx           # Historial y liquidación de Paper Bets (P&L y ROI%)
        │   └── calculator/page.tsx     # Calculadora Pro +EV y fracciones de Kelly
        ├── components/
        │   ├── AuthGate.tsx            # Protección de rutas y shell autenticado
        │   ├── AuthLayout.tsx          # Layout compartido de login/registro
        │   ├── Navbar.tsx              # Header fijo, bankroll, sync API y menú de usuario
        │   ├── SportsSidebar.tsx       # Catálogo lateral dinámico de ligas activas en RapidAPI
        │   ├── OddsBoard.tsx           # Tablero central por liga, KPIs y alertas HTTP 429
        │   ├── MatchRow.tsx            # Fila de partido 1-X-2 / 1-2 y desglose sin margen
        │   ├── BetSlipSidebar.tsx      # Boleto Paper Bet interactivo con slider y 1/4 Kelly
        │   ├── EVCalculatorForm.tsx    # Formulario cuantitativo manual validado contra backend
        │   ├── TrafficLightBadge.tsx   # Indicador visual de semáforo estadístico
        │   └── Icons.tsx               # Sistema propio de iconografía SVG
        ├── context/
        │   ├── AuthContext.tsx         # Sesión JWT, perfil y logout
        │   └── BettingContext.tsx      # Bankroll, formato de momios y paper bets desde la API
        ├── lib/
        │   ├── api.ts                  # Cliente HTTP tipado hacia FastAPI
        │   └── oddsUtils.ts            # Conversión Decimal <-> Americano y Criterio de Kelly
        └── types/
            └── index.ts                # Interfaces TypeScript compartidas
```

---

## Quick Start / Cómo Ejecutar (Docker + Frontend Local)

- **Token administrativo de prueba:** `betmetrics-super-secret-admin-token-2026` (para probar el endpoint protegido en Swagger UI dando clic en el botón *Authorize*).

### Paso 1: Configurar Variables de Entorno en Raíz y Levantar PostgreSQL + Redis + Backend

Desde la raíz del proyecto (`betMetrics/`):

```bash
# 1. Crear .env y configurar REDIS_PASSWORD, POSTGRES_PASSWORD,
#    JWT_SECRET_KEY, RAPIDAPI_KEY y API_SECRET_TOKEN
cp .env.example .env

# 2. Levantar PostgreSQL 16, Redis 7 y el microservicio FastAPI (con hot-reload)
docker compose up --build -d
```

- **Documentación interactiva (Swagger UI):** `http://localhost:8000/docs`
- **Healthcheck del servicio:** `http://localhost:8000/health`
- **PostgreSQL:** `localhost:5432` (base `betmetrics`, usuario `betmetrics` por defecto)
- Las tablas `users` y `paper_bets` se crean automáticamente al arrancar el backend.

> No hay Alembic todavía. Si cambias columnas de un modelo existente en desarrollo,
> recrea el volumen con `docker compose down -v` (esto borra los datos) o agrega una migración.
> `docker compose restart` no vuelve a crear tablas ya existentes.

### Paso 2: Levantar Cliente Web Next.js (`frontend/`)

En una nueva terminal:

```bash
cd frontend
npm install
npm run dev
```

- **Aplicación Web Sportsbook:** `http://localhost:3000`

Al abrir la web, los visitantes sin sesión ven la landing pública en `/`; al iniciar sesión, `/` muestra el sportsbook y las rutas protegidas redirigen a `/login`. Crea la primera cuenta desde `/register`; no hay usuarios semilla ni credenciales hardcodeadas.

---

## Autenticación, Usuarios y Base de Datos

- **Contraseñas:** hash Argon2 (`pwdlib`), nunca texto plano.
- **Sesión:** JWT HS256 firmado con `JWT_SECRET_KEY`, enviado como `Authorization: Bearer <token>`.
  Expira en 7 días por defecto (`ACCESS_TOKEN_EXPIRE_MINUTES=10080`).
- **Aislamiento:** cada usuario tiene su propio `starting_bankroll`, `odds_format`, perfil e historial de paper bets.
- **Persistencia:** PostgreSQL 16 es la fuente de verdad de usuarios y boletos; Redis sigue siendo solo caché de cuotas.
- **Cálculo confiable:** el backend recalcula el EV de cada paper bet y valida el bankroll disponible
  (`starting_bankroll + P&L realizado - stake pendiente`); no confía en los valores de EV enviados por el cliente.
- **Token administrativo:** `POST /api/v1/admin/sync-odds` usa un bearer distinto (`API_SECRET_TOKEN`), separado del login de usuarios.

Flujo básico de la API:

```text
POST /api/v1/auth/register  -> 201 + { access_token, user }
POST /api/v1/auth/login     -> 200 + { access_token, user }
GET  /api/v1/auth/me        -> perfil actual
PATCH /api/v1/auth/me       -> display_name, starting_bankroll u odds_format
GET/POST/PATCH/DELETE /api/v1/bets -> historial del usuario autenticado
```

---

## Estrategia Resiliente ante Límites de Cuota (`HTTP 429`) — Cero Datos Mockeados

BetMetrics opera **exclusivamente con datos reales** provenientes de RapidAPI (*The Odds API*). Nunca inyecta partidos inventados ni listas de ligas estáticas:

1. **Nivel 1 — Caché Fresca (`betmetrics:odds:fresh:{sport}`, TTL `300s`)**: Durante 5 minutos las lecturas se resuelven desde Redis (`source: "redis_cache"`) en milisegundos para proteger los créditos de RapidAPI.
2. **Nivel 2 — Respaldo Real *Stale-If-Error* (`betmetrics:odds:stale:{sport}`, TTL `86400s`)**: Cada respuesta exitosa de RapidAPI (`source: "rapidapi_live"`) actualiza también una fotografía real de respaldo por 24 horas.
3. **Comportamiento ante `HTTP 429 Too Many Requests` o caída externa**:
   - **Si existe captura real previa en Redis**: El backend entrega esa última foto real marcando `cached: true` y `source: "redis_stale_429"` (o `"redis_stale_error"`), y el frontend despliega un aviso ámbar transparente indicando que se muestra el último respaldo real almacenado.
   - **Si Redis no tiene ninguna captura previa para esa liga**: El backend responde honestamente con **`HTTP 503 Service Unavailable`** detallando el motivo exacto, sin inventar momios.

---

## Modelo Matemático: *De-Vigging*, Valor Esperado (+EV) y Criterio de Kelly

### 1. Probabilidad Justa Consenso (*Sharp-Weighted De-Vigging*)
Para cada casa de apuestas con cuotas decimales $\{O_1, \dots, O_n\}$, se elimina el margen (*overround* $\Omega = \sum_{i} \frac{1}{O_i}$) obteniendo probabilidades limpias $p_i = \frac{1 / O_i}{\Omega}$, ponderando con peso **$3\times$** a casas institucionales de bajo margen (*Pinnacle, Betfair, Matchbook, LowVig, Marathonbet*) frente a casas recreativas ($1\times$), y seleccionando simultáneamente la **mejor cuota disponible (*Best-Line Shopping*)** para cada selección.

### 2. Valor Esperado (+EV) y Semáforo Estadístico
Para la mejor cuota decimal $O$, probabilidad real estimada $P_{\text{win}} \in (0, 1)$, $P_{\text{loss}} = 1 - P_{\text{win}}$ y monto $\text{Stake}$:

$$\text{Profit} = \text{Stake} \times (O - 1)$$

$$\text{EV} = (P_{\text{win}} \times \text{Profit}) - (P_{\text{loss}} \times \text{Stake})$$

$$\text{EV\%} = \left(\frac{\text{EV}}{\text{Stake}}\right) \times 100$$

| Color Semáforo | Condición Matemática | Interpretación Operativa |
| :--- | :--- | :--- |
| **GREEN** (`GREEN`) | $\text{EV\%} > 3.0\%$ | Ventaja matemática sólida sobre el mercado (+EV claro) |
| **YELLOW** (`YELLOW`) | $0.0\% \le \text{EV\%} \le 3.0\%$ | Zona neutral / margen reducido |
| **RED** (`RED`) | $\text{EV\%} < 0.0\%$ | Expectativa matemática negativa a largo plazo |

### 3. Dimensionamiento de Bankroll (Criterio de Kelly)
Con ventaja positiva y $b = O - 1$, la fracción óptima del capital disponible es:

$$f^* = \frac{b \cdot P_{\text{win}} - P_{\text{loss}}}{b}$$

El boleto interactivo sugiere por defecto **$\frac{1}{4}$ de Kelly** ($0.25 \cdot f^*$) para controlar la varianza sobre el Bankroll virtual.

---

## Especificación de Endpoints REST (`api/v1` y `/health`)

| Método | Ruta | Headers | Query / Body | Respuesta Exitosa | Códigos de Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | Público | — | `200 OK`: Estado operativo del microservicio. | `200 OK` |
| `POST` | `/api/v1/auth/register` | `Content-Type: application/json` | `{"email": "...", "password": "...", "display_name": "..."}` | `201 Created`: Usuario + `access_token` JWT. | `201 Created`, `400 Bad Request`, `409 Conflict` |
| `POST` | `/api/v1/auth/login` | `Content-Type: application/json` | `{"email": "...", "password": "..."}` | `200 OK`: Usuario + `access_token` JWT. | `200 OK`, `400 Bad Request`, `401 Unauthorized` |
| `GET` | `/api/v1/auth/me` | `Authorization: Bearer <JWT>` | — | `200 OK`: Perfil del usuario autenticado. | `200 OK`, `401 Unauthorized` |
| `PATCH` | `/api/v1/auth/me` | `Authorization: Bearer <JWT>` | `{"display_name"?, "starting_bankroll"?, "odds_format"?}` | `200 OK`: Perfil actualizado. | `200 OK`, `400 Bad Request`, `401 Unauthorized` |
| `GET` | `/api/v1/bets` | `Authorization: Bearer <JWT>` | — | `200 OK`: Paper bets del usuario. | `200 OK`, `401 Unauthorized` |
| `POST` | `/api/v1/bets` | `Authorization: Bearer <JWT>` | `{"match_id", "match_name", "league", "selection", "outcome_key", "bookmaker", "decimal_odds", "true_probability", "stake"}` | `201 Created`: Bet creado con EV recalculado en servidor. | `201 Created`, `400 Bad Request`, `401 Unauthorized` |
| `PATCH` | `/api/v1/bets/{id}` | `Authorization: Bearer <JWT>` | `{"status": "PENDING\|WON\|LOST\|PUSH"}` | `200 OK`: Bet liquidado/actualizado. | `200 OK`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found` |
| `DELETE` | `/api/v1/bets/{id}` | `Authorization: Bearer <JWT>` | — | `204 No Content`: Bet eliminado. | `204 No Content`, `401 Unauthorized`, `404 Not Found` |
| `DELETE` | `/api/v1/bets` | `Authorization: Bearer <JWT>` | — | `204 No Content`: Historial completo eliminado. | `204 No Content`, `401 Unauthorized` |
| `GET` | `/api/v1/odds/sports` | `Accept: application/json` | — | `200 OK`: Catálogo dinámico real de deportes/ligas activas desde `/v4/sports`. | `200 OK`, `503 Service Unavailable` |
| `GET` | `/api/v1/odds/ev` | `Accept: application/json` | `sport` (ej. `soccer_mexico_ligamx`, `soccer_epl`), `stake` ($>0$) | `200 OK`: Eventos reales con celdas `outcomes` (`1-X-2` / `1-2`), `ev_percentage`, `traffic_light`, `cached` y `source`. | `200 OK`, `400 Bad Request`, `503 Service Unavailable` |
| `POST` | `/api/v1/calculations/ev` | `Content-Type: application/json` | `{"match_name": "...", "decimal_odds": 2.20, "true_probability": 0.50, "stake": 100.0}` | `201 Created`: Resultado matemático +EV y semáforo. | `201 Created`, `400 Bad Request`, `500 Internal Server Error` |
| `POST` | `/api/v1/admin/sync-odds` | `Authorization: Bearer <API_SECRET_TOKEN>` | `{"sport": "soccer_epl", "force_invalidate": true}` | `200 OK`: Invalidación de caché fresca en Redis y resincronización con RapidAPI. | `200 OK`, `400 Bad Request`, `401 Unauthorized`, `503 Service Unavailable` |

---

## Suite de Pruebas Rápidas (`tests.http`)

Con Docker corriendo en `http://localhost:8000`, abre `tests.http` en VS Code con la extensión **REST Client** (`humao.rest-client`), ajusta `@adminToken` al valor de tu `.env` y ejecuta las peticiones en orden. Las solicitudes `0.1`–`0.8` cubren registro, login, perfil, paper bets y liquidación; el token JWT se reutiliza mediante las respuestas nombradas (`{{login.response.body.access_token}}`). Después continúan las pruebas de catálogo, cálculo `+EV`, validaciones `400` y protección `401` / `200` del endpoint administrativo.

> `0.1` devuelve `409 Conflict` si el usuario `demo@betmetrics.app` ya existe; en ese caso salta directo a `0.2` (login).

---

## Controles de Seguridad Implementados (OWASP)

1. **Prevención de Fuga de Información (*Mishandling of Exceptional Conditions*)**: Manejadores globales en `app/core/exceptions.py` y middleware de blindaje en `app/main.py` garantizan respuestas JSON sanitizadas sin filtrar *stack traces* internos.
2. **Hardening de Contenedores y Caché (*OWASP A02:2025*)**: Contenedor **Redis 7** protegido por contraseña obligatoria (`--requirepass`), **PostgreSQL 16** con contraseña obligatoria y sin puerto expuesto fuera de la red cuando no se necesita, e imagen **FastAPI** ejecutada bajo usuario sin privilegios (`appuser`, UID `1001`).
3. **Autenticación de usuarios resistente a filtraciones**: contraseñas hasheadas con **Argon2**, JWT firmados con `JWT_SECRET_KEY` y expiración configurable; los recursos de paper betting se filtran siempre por `user_id`. El token administrativo (`API_SECRET_TOKEN`) es independiente del login de usuarios y se compara en tiempo constante mediante `secrets.compare_digest` en `app/core/security.py`, sin secretos por defecto en código fuente.
