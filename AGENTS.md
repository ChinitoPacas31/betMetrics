# AGENTS.md

Decoupled +EV sportsbook scanner: FastAPI backend + Redis cache + Next.js 14 frontend. All odds are live from The Odds API via RapidAPI; there are no mocks, seeds, or fixture files by design.

## Running

- Backend + Redis: from repo root, `cp .env.example .env`, fill `REDIS_PASSWORD`, `RAPIDAPI_KEY`, `API_SECRET_TOKEN`, then `docker compose up --build -d`. API at `http://localhost:8000`, Swagger `/docs`, health `/health`.
- Frontend is **not** in docker-compose and there is no root `package.json`: `cd frontend && cp .env.example .env.local && npm install && npm run dev` (`http://localhost:3000`).
- Compose mounts `backend/app` read-only with `uvicorn --reload`, so code edits hot-reload. Dependency changes require `docker compose up --build -d`.
- `backend/app/core/config.py` loads `.env` relative to the process CWD. In Docker, settings come from compose `env_file`/`environment`; when running uvicorn directly from `backend/`, provide `backend/.env` or exported vars.
- Secrets are gitignored; only `.env.example` files are tracked. Never add fallback secret values in code.

## Verification

- No pytest suite, no Python lint/typecheck config, no CI workflows. Verify via `docker compose up --build -d` then `tests.http` (VS Code REST Client) or equivalent curl against `/health`, `/api/v1/odds/sports`, `/api/v1/odds/ev`, and the admin sync cases (401 without/with bad bearer, 200 with valid).
- Frontend: `npm run build` is the real typecheck/compile gate (`tsc` strict, no separate typecheck script). `npm run lint` is defined but there is no ESLint config or dependency, so `next lint` will prompt to scaffold; don't assume lint is configured. There are no frontend tests.
- External API tests consume real RapidAPI credits and can hit HTTP 429. Redis stale data may mask a live failure (`source: redis_stale_*`).

## Architecture / invariants

- Real-data contract: never introduce mock/seed odds. On RapidAPI failure the backend serves the 24h Redis stale snapshot (`cached: true`, `source: redis_stale_429|redis_stale_error`) or returns 503. The frontend depends on `cached`/`source` fields, so don't rename or repurpose them.
- All routes live under `/api/v1` (`backend/app/api/v1/router.py`); `/health`, `/docs`, `/redoc` are outside it. CORS only allows `http://localhost:3000` / `127.0.0.1:3000` by default (`CORS_ORIGINS`).
- De-vig logic in `backend/app/services/rapidapi_client.py`: bookmakers in `SHARP_BOOKMAKERS` get 3x weight, others 1x; best-line shopping picks max decimal odds per outcome; soccer-prefixed sport keys get 3-way (`1/X/2`), others 2-way.
- EV thresholds in `backend/app/services/ev_calculator.py` are exact and contractual: `> 3.0%` GREEN, `0.0–3.0%` YELLOW, `< 0.0%` RED.
- `POST /api/v1/admin/sync-odds` requires `Authorization: Bearer <API_SECRET_TOKEN>` (constant-time compare). The frontend asks the user for the token at runtime; never hardcode it.
- Pydantic request models use `extra="forbid"`, so adding an unknown field to calculation/sync payloads yields 400.
- Redis is cache only (no database/migrations); keys are `betmetrics:odds:fresh:{sport}`, `betmetrics:odds:stale:{sport}`, and `betmetrics:sports:*`.

## Frontend

- Next.js App Router under `frontend/src/app`; imports use `@/*` → `src/*`. Interactive pages/components are `"use client"`.
- Global state lives in `frontend/src/context/BettingContext.tsx` (bankroll, odds format, paper bets). It persists to `localStorage` under `betmetrics_*_v1` keys; changing persisted shapes needs a key bump or migration.
- HTTP calls are centralized in `frontend/src/lib/api.ts` and use `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8000/api/v1`). `NEXT_PUBLIC_*` is inlined at build/dev start, so restart dev after changing it.
- `OddsBoard` renders `MatchRow`; `MatchCard.tsx` is an unused thin wrapper around `MatchRow` — edit `MatchRow` for actual match-row UI changes.
- README and user-facing copy are Spanish; keep new UI text consistent with that.
