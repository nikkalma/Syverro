# Syverro

Reading app monorepo: web SPA, mobile client, and FastAPI backend.

## Layout

```
backend/          FastAPI API + SQLAlchemy models
  app/            Application code
  tests/          Pytest suite
web/              React + Vite frontend
  src/            UI + client API
mobile/           Expo / React Native app
deploy/           VPS pull/up helper
docker-compose.yml       Local stack (build from source)
docker-compose.prod.yml  VPS stack (pull GHCR images)
.github/workflows/       test, publish, deploy
```

| Path | Role |
|------|------|
| `backend/` | API, DB models, schema checks |
| `web/` | Browser app + admin UI |
| `mobile/` | Mobile client |
| `deploy/` | Production compose helper |

## Local run

```bash
cp .env.example .env
docker compose up --build
```

- Web: http://localhost:3000  
- API: http://localhost:8000 (`/health`, `/docs`)  
- Postgres: `localhost:5432`

## Tests

**Add tests with every new feature or bugfix** — cover the happy path and the failure you care about (e.g. schema drift for DB changes).  
**Run the relevant suite before every commit.** Do not push red tests.

### Backend

Config: `backend/pyproject.toml`  
Tests: `backend/tests/`  
Schema helper: `backend/app/schema_check.py`

```bash
cd backend
pip install -r requirements-dev.txt
# unit tests (no DB):
pytest tests/test_schema_diff_unit.py tests/test_security.py -q
# full suite (needs Postgres):
export TEST_DATABASE_URL=postgresql+asyncpg://test:test@localhost:5432/syverro_test
pytest -q
```

When you change **models or migrations**, add/adjust schema tests so missing or unexpected columns fail CI.

### Web

Config: `web/vite.config.ts` (`test` block)  
Tests: `web/src/**/*.{test,spec}.{ts,tsx}`

```bash
cd web
npm install
npm test
```

When you add UI logic or utils, add a co-located `*.test.ts(x)` next to the code.

### CI

`.github/workflows/test.yml` runs backend + web tests on PRs and pushes to `main`.
