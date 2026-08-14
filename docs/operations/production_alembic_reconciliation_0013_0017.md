# Production Alembic reconciliation: 0013–0017

This procedure reconciles production when Alembic reports
`0012_quote_type`, while the database already contains the schema represented
by migrations 0013–0016. Use an approved maintenance window and a pinned commit
and image SHA.

## Safety boundaries

- Keep the old backend running through reconciliation, stamping, and migration
  0017. These changes are backward-compatible with it.
- Never run migrations 0013–0016: their columns already exist.
- Stop on every unexpected revision, schema definition, count, or health result.
- Do not automatically downgrade after partial failure.
- Current backend images require an explicit migration step before application
  startup. The former runtime `ALTER TABLE` path caused this drift and has been
  removed; never substitute application startup for the commands below.

## Exact procedure

Run from `/opt/syverro`. Do not echo `.env`, `DATABASE_URL`, or credentials.

1. Confirm the approved repository revision and healthy containers:

   ```sh
   git rev-parse HEAD
   docker compose -f docker-compose.prod.yml ps
   curl -fsS http://127.0.0.1:8000/health
   ```

2. Create and validate a fresh custom-format backup:

   ```sh
   backup_stamp="$(date -u +%Y%m%dT%H%M%SZ)"
   backup_path="backups/pre-alembic-0013-0017-${backup_stamp}.dump"
   mkdir -p backups
   docker exec syverro-postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$backup_path"
   test -s "$backup_path"
   docker exec -i syverro-postgres sh -c 'pg_restore -l' < "$backup_path" >/dev/null
   printf 'Backup: %s\n' "$backup_path"
   ```

3. Record Alembic revision and the book row count:

   ```sh
   docker exec syverro-postgres sh -c \
     'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc \
     "SELECT version_num FROM alembic_version; SELECT count(*) FROM books;"'
   ```

   The required revision is exactly `0012_quote_type`.

4. Run the reconciliation transaction:

   ```sh
   docker exec -i syverro-postgres sh -c \
     'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
     < deploy/reconcile_alembic_0013_0016.sql
   ```

   It validates the complete 0013–0016 schema and renames only three foreign
   keys. Any mismatch aborts and rolls back all renames.

5. Repeat the approved catalog and orphan-count queries. Confirm the final FK
   names and zero orphan counts.

6. Pull, but do not start, the pinned backend image containing secured database
   logging. Run Alembic through one-off containers from that image:

   ```sh
   export IMAGE_TAG="sha-<approved-short-sha>"
   export BACKEND_IMAGE="ghcr.io/nikkalma/syverro-backend:${IMAGE_TAG}"
   docker compose -f docker-compose.prod.yml pull backend
   docker compose -f docker-compose.prod.yml run --rm --no-deps backend \
     alembic stamp 0016_knowledge_node_lifecycle
   docker compose -f docker-compose.prod.yml run --rm --no-deps backend alembic current
   ```

   Require `0016_knowledge_node_lifecycle` before continuing.

7. Apply migration 0017, then upgrade the pinned image to its exact head, still
   without replacing the running backend:

   ```sh
   docker compose -f docker-compose.prod.yml run --rm --no-deps backend \
     alembic upgrade 0017_book_slugs
   docker compose -f docker-compose.prod.yml run --rm --no-deps backend alembic current
   docker compose -f docker-compose.prod.yml run --rm --no-deps backend \
     python -m app.migrations upgrade
   docker compose -f docker-compose.prod.yml run --rm --no-deps backend \
     python -m app.migrations check
   ```

   Require `0018_email_verification` for commit `1a0b236`. For later pinned
   images, require the head reported by that image's migration check.

8. Verify invariants and compare `book_count` with step 3:

   ```sql
   SELECT count(*) AS book_count FROM books;
   SELECT count(*) AS null_or_empty_slugs FROM books
    WHERE slug IS NULL OR btrim(slug) = '';
   SELECT count(*) AS duplicate_slug_groups FROM
    (SELECT slug FROM books GROUP BY slug HAVING count(*) > 1) duplicates;
   SELECT count(*) AS valid_slug_index
     FROM pg_index x JOIN pg_class i ON i.oid=x.indexrelid
    WHERE i.relname='ix_books_slug' AND x.indisvalid AND x.indisunique;
   SELECT count(*) AS readable_jane_eyre_slug FROM books
    WHERE lower(title)='jane eyre' AND slug='jane-eyre';
   ```

   Require unchanged book count, `0` null/empty slugs, `0` duplicate groups,
   `1` valid unique index, and at least one readable Jane Eyre slug.

9. Replace backend only, then verify health, slug lookup, and a previously
   recorded UUID lookup:

   ```sh
   docker compose -f docker-compose.prod.yml up -d --no-deps backend
   docker compose -f docker-compose.prod.yml ps backend
   curl -fsS http://127.0.0.1:8000/health
   curl -fsS http://127.0.0.1:8000/books/jane-eyre >/dev/null
   curl -fsS "http://127.0.0.1:8000/books/<recorded-book-uuid>" >/dev/null
   ```

10. Pull and replace web only after backend verification:

    ```sh
    export WEB_IMAGE="ghcr.io/nikkalma/syverro-web:${IMAGE_TAG}"
    docker compose -f docker-compose.prod.yml pull web
    docker compose -f docker-compose.prod.yml up -d --no-deps web
    docker compose -f docker-compose.prod.yml ps
    ```

11. Smoke-test `/book/jane-eyre`, an old UUID BookPage URL, slug links from the
    catalog and AuthorPage, UUID-based personal-library matching, and the
    ID-based Studio Book Workspace.

12. After secured logging is confirmed in production, rotate the database
    credential through a separately approved atomic procedure. Never print it.

## Rollback boundaries

- Before reconciliation: no schema mutation; discard the attempt.
- During reconciliation: SQL errors roll back the entire transaction.
- After reconciliation but before stamp: the old backend remains compatible.
  Any reverse constraint rename requires separate review.
- After stamp but before 0017: stop and reconcile Alembic state; do not downgrade.
- After 0017 but before backend replacement: keep the old backend running and
  investigate. The slug column is backward-compatible.
- After backend replacement: roll back the container image if needed, but keep
  the database at 0017 pending review.
- Restore the pg_dump only after an explicit incident decision. Restoration is
  destructive and is outside this procedure.
