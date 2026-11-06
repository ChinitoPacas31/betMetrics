# AGENTS.md

Decoupled +EV sportsbook scanner: FastAPI backend + PostgreSQL 16 + Redis cache + Next.js 14 frontend. All odds are live from The Odds API via RapidAPI; there are no mocks, seeds, or fixture files by design. Users, profiles, and paper bets are persisted in PostgreSQL with JWT auth.

## Running

- Full backend stack: from repo root, `cp .env.example .env`, fill `REDIS_PASSWORD`, `POSTGRES_PASSWORD`, `JWT_SECRET_KEY`, `RAPIDAPI_KEY`, `API_SECRET_TOKEN`, then `docker compose up --build -d`. This starts PostgreSQL, Redis, and FastAPI. API at `http://localhost:8000`, Swagger `/docs`, health `/health`.
- Frontend is **not** in docker-compose and there is no root `package.json`: `cd frontend && cp .env.example .env.local && npm install && npm run dev` (`http://localhost:3000`). Unauthenticated visitors see the public landing at `/`; protected routes redirect to `/login`; create the first account at `/register` (no seeded users).
- Compose mounts `backend/app` read-only with `uvicorn --reload`, so code edits hot-reload. Dependency changes require `docker compose up --build -d`.
- `backend/app/core/config.py` loads `.env` relative to the process CWD. In Docker, settings come from compose `env_file`/`environment`; when running uvicorn directly from `backend/`, copy `backend/.env.example` to `backend/.env` or export vars.
- Tables `users` and `paper_bets` are created by SQLAlchemy `create_all` during the FastAPI lifespan. Models live in `backend/app/models/` (`base.py`, `user.py`, `paper_bet.py`). There is no Alembic: changing an existing model column requires a migration or a destructive `docker compose down -v`. `create_all` will not alter existing tables.
- Secrets are gitignored; only `.env.example` files are tracked. Never add fallback secret values in code.

## Verification

- No pytest suite, no Python lint/typecheck config, no CI workflows. Verify via `docker compose up --build -d` then `tests.http` (VS Code REST Client) or equivalent curl. Run the auth flow in order: register (`0.1`) → login (`0.2`) → `/auth/me` → paper bets CRUD; named responses carry the JWT (`{{login.response.body.access_token}}`). Then check `/health`, `/api/v1/odds/sports`, `/api/v1/odds/ev`, and admin sync cases (401 without/bad bearer, 200 with valid). Registering the same demo email twice returns 409, so skip to login on re-runs.
- Frontend: `npm run build` is the real typecheck/compile gate (`tsc` strict, no separate typecheck script). `npm run lint` is defined but there is no ESLint config or dependency, so `next lint` will prompt to scaffold; don't assume lint is configured. There are no frontend tests.
- External API tests consume real RapidAPI credits and can hit HTTP 429. Redis stale data may mask a live failure (`source: redis_stale_*`).

## Architecture / invariants

- Real-data contract: never introduce mock/seed odds. On RapidAPI failure the backend serves the 24h Redis stale snapshot (`cached: true`, `source: redis_stale_429|redis_stale_error`) or returns 503. The frontend depends on `cached`/`source` fields, so don't rename or repurpose them.
- All routes live under `/api/v1` (`backend/app/api/v1/router.py`); `/health`, `/docs`, `/redoc` are outside it. CORS only allows `http://localhost:3000` / `127.0.0.1:3000` by default (`CORS_ORIGINS`).
- De-vig logic in `backend/app/services/rapidapi_client.py`: bookmakers in `SHARP_BOOKMAKERS` get 3x weight, others 1x; best-line shopping picks max decimal odds per outcome; soccer-prefixed sport keys get 3-way (`1/X/2`), others 2-way.
- EV thresholds in `backend/app/services/ev_calculator.py` are exact and contractual: `> 3.0%` GREEN, `0.0–3.0%` YELLOW, `< 0.0%` RED.
- `POST /api/v1/admin/sync-odds` requires `Authorization: Bearer <API_SECRET_TOKEN>` (constant-time compare). The frontend asks the user for the token at runtime; never hardcode it.
- Pydantic request models use `extra="forbid"`, so adding an unknown field to calculation/sync/auth/bet payloads yields 400.
- Redis is cache only; keys are `betmetrics:odds:fresh:{sport}`, `betmetrics:odds:stale:{sport}`, and `betmetrics:sports:*`. PostgreSQL is the system of record for users and paper bets.

## Auth / user data

- Auth endpoints live in `backend/app/api/v1/endpoints/auth.py`: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PATCH /auth/me`. Passwords are hashed with Argon2 via `pwdlib`; JWTs are HS256 and signed with `JWT_SECRET_KEY` (falls back to `API_SECRET_TOKEN` only when unset, for development).
- Bearer auth for users is separate from admin auth. `verify_admin_token` still guards `/admin/sync-odds` with `API_SECRET_TOKEN`; `get_current_user` validates JWT and loads the active `User` row from PostgreSQL.
- Paper bets (`backend/app/api/v1/endpoints/bets.py`) are always filtered by `user_id`. The server recomputes EV and rejects stakes above available bankroll (`starting_bankroll + realized P&L - pending stake`); never trust client-provided EV.
- The frontend stores the JWT in `localStorage` under `betmetrics_auth_token_v1` and sends it via `Authorization: Bearer`; `lib/api.ts` exposes `setAuthToken` and dispatches `betmetrics:unauthorized` on any 401, which `AuthContext` uses to clear the session.

## Frontend

- Next.js App Router under `frontend/src/app`; imports use `@/*` → `src/*`. Interactive pages/components are `"use client"`.
- `AuthProvider` wraps the app in `layout.tsx`; `AuthGate` allows the public landing at `/` and redirects unauthenticated visitors to `/login` for protected routes. It mounts `BettingProvider` + `Navbar` only for authenticated routes; `/login` and `/register` render outside that shell.
- `BettingContext` now loads bankroll, odds format, and paper bets from the API. Only the active sport preference remains in `localStorage` (`betmetrics_active_sport_v1`); bankroll and bets are no longer persisted locally.
- HTTP calls are centralized in `frontend/src/lib/api.ts` and use `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8000/api/v1`). `NEXT_PUBLIC_*` is inlined at build/dev start, so restart dev after changing it.
- `OddsBoard` renders `MatchRow`; `MatchCard.tsx` is an unused thin wrapper around `MatchRow` — edit `MatchRow` for actual match-row UI changes.
- README is Spanish; the current UI copy is English. Keep new UI text consistent with the existing application language.
