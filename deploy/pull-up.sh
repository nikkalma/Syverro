#!/usr/bin/env bash
# VPS deploy helper: log in to GHCR (if needed), pull images, recreate stack.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy .env.prod.example to .env and fill secrets." >&2
  exit 1
fi

# shellcheck disable=SC1091
REQUESTED_IMAGE_TAG="${IMAGE_TAG:-}"
REQUESTED_BACKEND_IMAGE="${BACKEND_IMAGE:-}"
REQUESTED_WEB_IMAGE="${WEB_IMAGE:-}"
set -a
source .env
set +a

if [[ -n "${GHCR_TOKEN:-}" && -n "${GHCR_USER:-}" ]]; then
  echo "Logging in to ghcr.io as ${GHCR_USER}..."
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
fi

IMAGE_TAG="${REQUESTED_IMAGE_TAG:-${IMAGE_TAG:-main}}"
BACKEND_IMAGE="${REQUESTED_BACKEND_IMAGE:-${BACKEND_IMAGE:-ghcr.io/nikkalma/syverro-backend:${IMAGE_TAG}}}"
WEB_IMAGE="${REQUESTED_WEB_IMAGE:-${WEB_IMAGE:-ghcr.io/nikkalma/syverro-web:${IMAGE_TAG}}}"

export IMAGE_TAG BACKEND_IMAGE WEB_IMAGE

echo "Pulling images..."
echo "  backend: ${BACKEND_IMAGE}"
echo "  web:     ${WEB_IMAGE}"
docker compose -f "$COMPOSE_FILE" pull

echo "Ensuring PostgreSQL is ready..."
docker compose -f "$COMPOSE_FILE" up -d --wait postgres

echo "Applying database migrations from the pinned backend image..."
docker compose -f "$COMPOSE_FILE" run --rm --no-deps backend \
  python -m app.migrations upgrade
docker compose -f "$COMPOSE_FILE" run --rm --no-deps backend \
  python -m app.migrations check

echo "Starting stack..."
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "Status:"
docker compose -f "$COMPOSE_FILE" ps

echo "Backend health (localhost:8000):"
for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:8000/health >/dev/null 2>&1; then
    curl -fsS http://127.0.0.1:8000/health
    echo
    echo "Deploy OK"
    exit 0
  fi
  sleep 2
done

echo "Backend did not become healthy in time." >&2
docker compose -f "$COMPOSE_FILE" logs --tail=80 backend
exit 1
