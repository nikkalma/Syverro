# Legacy Books Import

> One-time migration of the static JSON book catalog into the Syverro
> database, with moderation workflow.

## Source

**File:** `web/src/data/books.json` (148 entries)

This file was previously used only by the frontend as a static catalog.
After the switch to a backend-driven architecture, these books were
no longer visible in the application. This import restores them.

## Import Rules

### Fields imported

| JSON field | Model field | Notes |
|---|---|---|
| `title` | `Book.title` | Required. Trimmed of leading/trailing whitespace. |
| `author` | `Author.name` + `book_authors` | Always creates or reuses an Author entity. The denormalized `Book.author` string is also set. |
| `authorCountry` | `Author.country` | Only if present and non-empty. |
| `cover` | `Book.cover` | Only if a non-empty string. |
| `description` | `Book.description` | Only if a non-empty string. |
| `totalPages` | `Book.total_pages` | Only if an integer. |
| `originalYear` | `Book.original_publication_year` | Only if an integer. |
| `originalLanguage` | `Book.original_language` | Only if a non-empty string. |

### Fields explicitly ignored

| JSON field | Reason |
|---|---|
| `id` | Frontend-only string ID, no UUID equivalent. |
| `genres` | Dirty data — contains dates, numbers, and unmappable strings. Import would require fuzzy matching against existing Genre slugs (all English), which is unreliable. |
| `subgenres` | No matching model field. |
| `vibe` | No matching model field. |
| `themes` | Legacy JSON column on Book, being deprecated in favour of the knowledge graph (`BookKnowledgeRelation` + `KnowledgeNode`). |
| `motifs` | Same as `themes`. |
| `averageRating` | Calculated field, no model equivalent. |
| `totalRatings` | No model equivalent. |
| `createdAt` | Frontend-only timestamp. |

### Moderation state

Every imported book enters the moderation pipeline:

- `moderation_status = "pending"`
- `is_published = False`
- `metadata_status = "incomplete"`

Books are visible only in the admin moderation queue. They will not
appear in the public catalog until a moderator:
1. Fills in missing fields via `BookEnrichmentPage`
2. Sets `metadata_status` to `review_ready` or `complete`
3. Approves moderation (`moderation_status = "approved"`)
4. Publishes (`is_published = True`)

## Author handling

Every JSON `author` field produces an Author entity:

- Normalized by NFKC, case-folded, and whitespace-collapsed.
- If a matching Author exists (by normalized name), it is reused.
- If not, a new Author is created with the original name.
- The many-to-many `book_authors` table links each book to its author.

## Idempotency

The script is safe to run multiple times:

- Duplicate detection uses `(normalized_title, normalized_author)`.
- Already-imported books are skipped (logged as duplicates).
- Already-existing authors are reused (logged as reused).

If a book title or author string changes in the JSON between runs,
the changed entry will be imported as a new record (the old one is
not modified). This is intentional — the script never updates or
deletes existing data.

## How to run

```bash
# From the project root (where .env is located):
cd C:\Users\kleme\Syverro
python -m app.scripts.import_legacy_books

# With a custom file path:
python -m app.scripts.import_legacy_books --file some/other/books.json
```

### Prerequisites

- Python virtual environment activated.
- `DATABASE_URL` set in `.env` (or environment).
- Database running and accessible.
- Tables already exist (`alembic upgrade head` or `Base.metadata.create_all`).

## Expected output

```
INFO: Loaded 148 entries from web/src/data/books.json
INFO: Database connection OK
INFO: Existing books in DB: 5
INFO: Existing authors in DB: 4
INFO: [1] Imported: "Title" — Author
...

============================================================
  IMPORT SUMMARY
============================================================
  Total entries in file:  148
  Imported:               143
  Skipped duplicates:     3
  Skipped invalid:        2
  Authors created:        37
  Authors reused:         106
============================================================
```

## Verification

After import, check:

```bash
# Books exist in DB
python -c "
from app.database import AsyncSessionLocal
from app.models.book import Book
from sqlalchemy import select
import asyncio
async def check():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Book))
        books = result.scalars().all()
        pending = [b for b in books if b.moderation_status == 'pending']
        print(f'Total books: {len(books)}')
        print(f'Pending moderation: {len(pending)}')
asyncio.run(check())
"
```
