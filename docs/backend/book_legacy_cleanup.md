# Book Domain — Legacy Cleanup Roadmap

## Current Architecture

| Domain | Source of Truth | Cache Fields | Status |
|--------|---------------|--------------|--------|
| Authors | `book_authors` M:N → `Author` | `Book.author`, `Book.author_id` | Synced |
| Genres | `book_genres` M:N → `Genre` | `Book.genres` | Synced |
| Themes/Motifs | `BookKnowledgeRelation` → `KnowledgeNode` | `Book.themes`, `Book.motifs` (deprecated) | No reads/writes |

---

## Safe to Remove Immediately

### 1. `books.themes` database column

- **File:** `models/book.py:53`
- **Type:** `Column(JSON, default=[])`
- **Runtime usage:** Zero — no reads, no writes anywhere in backend
- **Frontend impact:** None — frontend reads from API response dict built from M:N taxonomy via `_build_book_dict` / `_book_to_response_dict`
- **Required steps:**
  1. Create Alembic migration: `ALTER TABLE books DROP COLUMN themes;`
  2. Remove column declaration from `models/book.py`
  3. Remove from `schemas/book.py:BookResponse.themes` (if present; currently absent from public schema defaults — check)

### 2. `books.motifs` database column

- **File:** `models/book.py:54`
- **Type:** `Column(JSON, default=[])`
- **Runtime usage:** Zero — no reads, no writes anywhere in backend
- **Frontend impact:** None (same as themes)
- **Required steps:**
  1. Create Alembic migration: `ALTER TABLE books DROP COLUMN motifs;`
  2. Remove column declaration from `models/book.py`
  3. Remove from `schemas/book.py:BookResponse.motifs` (if present)

### 3. `author_ref` ORM relationship + `Author.books` backref

- **Files:** `models/book.py:58`, `models/author.py:61-64`
- **Type:** `relationship("Author", back_populates="books")` — legacy one-to-many via `Book.author_id`
- **Runtime usage:** Zero — no business logic references either relationship
- **Safe removal steps:**
  1. Remove `author_ref` from `Book` model in `models/book.py`
  2. Remove `books` from `Author` model in `models/author.py` (the one-to-many, not `book_refs`)
  3. No migration needed — pure ORM change, no DB impact

### 4. `author_id` FK constraint on `books` table

- **File:** `models/book.py:15`
- **Type:** `Column(UUID, ForeignKey("authors.id"), nullable=True)`
- **Note:** The column itself must stay as a compatibility cache field. Only the FK constraint can be dropped.
- **Required steps:**
  1. Create Alembic migration: `ALTER TABLE books DROP CONSTRAINT books_author_id_fkey;`
  2. Change column declaration to `author_id = Column(UUID(as_uuid=True), nullable=True)` (remove `ForeignKey`)
  3. Keep the column — it's still used for compatibility output
- **Risk:** Low. The FK constraint was never enforced for business logic; all author lookups go through `book_authors` M:N.

---

## Deferred Removals (Require API Contract Changes)

### 5. `Book.author` column

- **Current use:** Compatibility output in all three response builders (`admin.py`, `books.py`, `sync.py`) + unique constraint `(title, author)`
- **Can remove when:**
  - All API consumers (mobile/web) migrate to the `authors` M:N field
  - The unique constraint `(title, author)` is replaced with a constraint on `book_authors`
  - Sync payloads stop sending `author` string
- **Dependencies:**
  - Frontend `GlobalBook.author` → replace with `authors[0].name`
  - Frontend `AdminBook.author` → replace with `authors[0].name`
  - Sync protocol `book_to_dict` → remove `author` key
  - Unique constraint migration

### 6. `Book.author_id` column

- **Current use:** Compatibility output in admin and sync response builders
- **Can remove when:** All API consumers switch to `authors[0].id` from M:N
- **Dependencies:** Same as `Book.author`

### 7. `Book.genres` column

- **Current use:** Compatibility output in all three response builders + sync payload
- **Can remove when:** All API consumers switch to `genre_objects` / `genre_ids` from M:N
- **Dependencies:**
  - Frontend `AdminBook.genres` → replace with `genre_objects[*].name`
  - Frontend `GlobalBook.genres` → replace with `genre_objects[*].name`
  - Sync protocol → remove `genres` key

---

## Discovery: Public API Missing Themes/Motifs

**Status: Fixed in current session**

The public API response builder (`_book_to_response_dict` in `api/books.py`) was not querying `BookKnowledgeRelation` for themes/motifs. It returned empty arrays while the admin API (`_build_book_dict` in `admin.py`) correctly queried M:N taxonomy.

**Fix applied:** Added `get_book_taxonomy_items()` calls to `_book_to_response_dict`, matching the admin response builder pattern.

---

## Audit: `Book.author` Search Filters (Not Migrated)

Three admin search endpoints still filter on `Book.author.contains(search)`:

| Endpoint | File:Line |
|----------|-----------|
| `GET /admin/books` | `admin.py:429` |
| `GET /admin/moderation/books` | `admin.py:700` |
| `GET /admin/metadata/books` | `admin.py:867` |

**Not migrating because:**
- `Book.author` is synced from M:N on every mutation — no staleness risk
- Migration to `Author.name.contains(search)` via JOIN requires deduplication (`DISTINCT` or subquery) to avoid multiplying rows when a book has multiple matching authors
- Behavioral change: currently searches only the first/primary author name; M:N search would match any linked author — different semantics, needs product decision
- No tests exist for the current search behavior to prove identical results

**Recommendation:** Revisit when search is refactored for M:N multi-author support.

---

## Audit: `similarity.py` `Book.author` Usage

**File:** `graph/similarity.py:96,113,136`

**Classification:** A) Display-only compatibility

`Book.author` is selected alongside `Book.title` in the shared-nodes query and included in the result dict for display. It does NOT participate in any scoring calculation. Scoring is purely based on Jaccard similarity of `KnowledgeNode` sets weighted by `TYPE_WEIGHTS`.

**No migration needed.** If desired in future, replace with a join through `book_authors` to get the primary author name — but this would change the query shape (LEFT JOIN vs direct column access) and is not worth the risk for a display-only field.

---

## Summary Table

| Item | Type | Removal | Effort | Risk | Blocks |
|------|------|---------|--------|------|--------|
| `books.themes` column | DB column | Immediate | Low (migration + model) | None | Nothing |
| `books.motifs` column | DB column | Immediate | Low | None | Nothing |
| `author_ref` relationship | ORM only | Immediate | Trivial (remove lines) | None | Nothing |
| `author_id` FK constraint | DB constraint | Immediate | Low (migration) | Low | Nothing |
| `Book.author` column | Cache + constraint | Deferred | Medium | Medium | API consumers |
| `Book.author_id` column | Cache | Deferred | Medium | Medium | API consumers |
| `Book.genres` column | Cache | Deferred | Medium | Medium | API consumers |
| `Book.author` search filters | Business logic | Deferred | Medium | Low | Search refactor |
| `similarity.py` `Book.author` | Display output | Deferred | Low | Low | Feature need |
