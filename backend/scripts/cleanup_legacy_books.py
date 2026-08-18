"""Legacy Book publication cleanup (dev/local ONLY; refuses to run in production).

Operates via raw SQL so it tolerates stale dev schemas (e.g. the local dev
database predates the ``books.slug`` column and the SyvAI tables).

Usage:
    python -m scripts.cleanup_legacy_books                 # dry-run report + backup export
    python -m scripts.cleanup_legacy_books --apply --yes   # apply reset and verify

Behavior:
  - SELECT  : books that are published or moderation-approved but carry no
              canonical publication_id backing.
  - REPORT  : exact candidate count + old state, no mutation.
  - BACKUP  : JSON export of candidate ids and pre-mutation fields to
              SYVERRO_BACKUP_DIR (default: opencode temp dir); path is printed.
  - APPLY   : in-place reset (is_published=False, moderation_status='pending',
              moderation_reason='legacy_cleanup'). Rows are never deleted and
              author/publication relations are preserved.
  - VERIFY  : public-visibility count (is_published AND approved AND not
              deleted) and row-count integrity before/after.
  - SAFETY  : refuses to run when ENVIRONMENT=production.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
from datetime import datetime, timezone
from pathlib import Path

import asyncpg

DEFAULT_DEV_DSN = "postgresql://test:test@localhost:5432/syverro"
BACKUP_DIR = Path(os.environ.get("SYVERRO_BACKUP_DIR", r"C:\Users\kleme\AppData\Local\Temp\opencode"))

SELECT_COLS = [
    "id",
    "title",
    "author",
    "author_id",
    "publication_id",
    "is_published",
    "moderation_status",
    "moderation_reason",
    "moderated_by",
    "moderated_at",
    "deleted_at",
    "created_at",
]


async def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="mutate the database")
    parser.add_argument("--yes", action="store_true", help="confirm mutation")
    parser.add_argument("--dsn", default=os.environ.get("DATABASE_URL", DEFAULT_DEV_DSN))
    args = parser.parse_args()

    if os.environ.get("ENVIRONMENT", "").lower() == "production":
        raise SystemExit("Refusing to run on environment=production")

    dsn = args.dsn.replace("+asyncpg", "").replace("+psycopg2", "")
    conn = await asyncpg.connect(dsn, timeout=10)
    try:
        cols = await _table_columns(conn)
        used_cols = [c for c in SELECT_COLS if c in cols]
        missing = [c for c in SELECT_COLS if c not in cols]
        if missing:
            print(f"NOTE: dev schema is missing columns (skipped by query): {missing}")

        col_sql = ", ".join(used_cols)
        total = await conn.fetchval("SELECT count(*) FROM books")
        visible = await _count_visible(conn, used_cols)
        candidates = await conn.fetch(
            "SELECT {cols} FROM books "
            "WHERE (is_published = true OR moderation_status = 'approved') "
            "AND publication_id IS NULL ORDER BY created_at".format(cols=col_sql)
        )

        rows = [dict(r) for r in candidates]
        for r in rows:
            r["is_published"] = bool(r.get("is_published"))
            for key in ("id", "author_id", "publication_id", "moderated_by"):
                if r.get(key) is not None:
                    r[key] = str(r[key])
            for key in ("moderated_at", "deleted_at", "created_at"):
                if r.get(key) is not None:
                    r[key] = r[key].isoformat()

        print("=== LEGACY BOOK CLEANUP REPORT (dry-run unless --apply) ===")
        print(f"environment      : {os.environ.get('ENVIRONMENT', 'development')}")
        print(f"total books      : {total}")
        print(f"public-visible   : {visible}")
        print(f"legacy candidates: {len(rows)}")

        backup_path = _export_backup(rows)
        print(f"backup exported  : {backup_path}")
        for r in rows:
            print(
                f"  {r['id']} publish={r['is_published']} "
                f"moderation={r.get('moderation_status')} "
                f"publication_id={r.get('publication_id')} title={str(r['title'])[:60]!r}"
            )

        if not args.apply:
            print("\nNo changes applied. Re-run with --apply --yes to mutate.")
            return
        if not args.yes:
            raise SystemExit("Mutation requires --yes.")

        candidate_ids = [r["id"] for r in rows]
        if candidate_ids:
            await conn.execute(
                "UPDATE books SET "
                "is_published = false, "
                "moderation_status = 'pending', "
                "moderation_reason = 'legacy_cleanup', "
                "moderated_at = $1 "
                "WHERE id = ANY($2::uuid[])",
                datetime.now(timezone.utc).replace(tzinfo=None),
                candidate_ids,
            )
        else:
            print("\nNo candidates to reset.")

        total_after = await conn.fetchval("SELECT count(*) FROM books")
        visible_after = await _count_visible(conn, used_cols)
        remaining = await conn.fetchval(
            "SELECT count(*) FROM books "
            "WHERE (is_published = true OR moderation_status = 'approved') "
            "AND publication_id IS NULL"
        )

        print("\n=== POST-CLEANUP VERIFICATION ===")
        print(f"total books      : {total_after} (unchanged rows: {total_after == total})")
        print(f"public-visible   : {visible_after} (was {visible})")
        print(f"legacy remaining : {remaining}")
        if candidate_ids:
            assert total_after == total, "row count changed; cleanup must never delete"
            assert visible_after == 0, "candidates should no longer be public-visible"
        print("\nreferential integrity: relations preserved (rows not deleted)")
    finally:
        await conn.close()


async def _table_columns(conn) -> set[str]:
    rows = await conn.fetch(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name = 'books'"
    )
    return {r["column_name"] for r in rows}


async def _count_visible(conn, used_cols: list[str]) -> int:
    has_deleted_at = "deleted_at" in used_cols
    deleted_clause = "AND deleted_at IS NULL" if has_deleted_at else ""
    return await conn.fetchval(
        "SELECT count(*) FROM books "
        "WHERE is_published = true AND moderation_status = 'approved'"
        f" {deleted_clause}"
    )


def _export_backup(rows: list[dict]) -> str:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = BACKUP_DIR / f"legacy_book_cleanup_{stamp}.json"
    payload = {"exported_at": stamp, "count": len(rows), "books": rows}
    path.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")
    return str(path)


if __name__ == "__main__":
    asyncio.run(main())