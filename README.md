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

## Deployment (VPS)

Flow: **push to `main`** → Publish workflow builds images to GHCR → VPS pulls and runs them.

| Image | Registry |
|-------|----------|
| Backend | `ghcr.io/nikkalma/syverro-backend:main` |
| Web | `ghcr.io/nikkalma/syverro-web:main` |

Prod compose binds services to **localhost only** (`:3000` web, `:8000` API, `:5432` DB). Put nginx/Caddy in front for public HTTPS.

### One-time VPS setup

1. Merge to `main` and confirm **Publish** succeeded (GitHub → Packages).
2. If packages are private: make them public, or use a PAT with `read:packages` on the VPS.
3. On the VPS (Docker required):

```bash
sudo mkdir -p /opt/syverro && sudo chown $USER:$USER /opt/syverro
git clone https://github.com/nikkalma/Syverro.git /opt/syverro
cd /opt/syverro
cp .env.prod.example .env
# set POSTGRES_PASSWORD, SECRET_KEY; optionally GHCR_USER / GHCR_TOKEN
chmod +x deploy/pull-up.sh
./deploy/pull-up.sh
curl -s http://127.0.0.1:8000/health
```

4. Point DNS at the VPS and reverse-proxy to `127.0.0.1:3000` (web) and `127.0.0.1:8000` (API).  
   Web bakes `VITE_API_URL` at image build (default `https://api.syverro.com`) — set repo variable `VITE_API_URL` before publish if needed.

### Everyday deploy

```bash
cd /opt/syverro
git pull          # if compose/scripts changed
./deploy/pull-up.sh
# or pin a build: IMAGE_TAG=sha-abc1234 ./deploy/pull-up.sh
```

### Optional auto-deploy

Repo variable: `ENABLE_VPS_DEPLOY=true`  
Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`  
Optional: `GHCR_TOKEN` (private packages), variable `VPS_APP_DIR` (default `/opt/syverro`)

After Publish succeeds on a `main` push, **Deploy** SSHs in and runs `pull-up.sh`.
