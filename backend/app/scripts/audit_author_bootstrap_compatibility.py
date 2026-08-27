"""Read-only JSON report for Author slug and language compatibility.

Usage: python -m app.scripts.audit_author_bootstrap_compatibility
This command performs SELECTs only and never commits or mutates ORM rows.
"""

import asyncio
import json
from dataclasses import asdict


async def run() -> None:
    from app.database import AsyncSessionLocal
    from app.services.author_slug import audit_existing_authors

    async with AsyncSessionLocal() as db:
        rows = await audit_existing_authors(db)
    print(json.dumps([asdict(row) for row in rows], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(run())
