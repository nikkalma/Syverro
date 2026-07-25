# Metadata Lifecycle

## Status Flow

```
                    ┌──────────┐
                    │  draft   │
                    └────┬─────┘
                         │ enrichment / author / genre / taxonomy mutation
                         ▼
                  ┌──────────────┐
                  │  incomplete  │
                  └──────┬───────┘
                         │ all required fields present
                         ▼
                 ┌───────────────┐
                 │  review_ready │  ← manual set only
                 └───────┬───────┘
                         │ admin reviews + approves
                         ▼
                 ┌───────────────┐
                 │   complete    │  ← auto-set when no missing fields
                 └───────────────┘
```

- **draft**: Initial state on book creation. Auto-promoted to `incomplete` on first mutation.
- **incomplete**: At least one required field is missing. Set automatically after any mutation (enrichment, author link/unlink, genre sync, taxonomy change).
- **review_ready**: Manually set by admin. Blocks auto-recalculation — allows reviewer to work without status changing under them. Set via `PUT /admin/metadata/books/{id}/status`.
- **complete**: All required fields present. Auto-set by any mutation.

### Status transition rules

| Transition | Trigger | Location |
|-----------|---------|----------|
| Any → incomplete | Any mutation with missing fields | `metadata_service.py:recalculate_metadata_status` |
| Any → complete | Any mutation with no missing fields | `metadata_service.py:recalculate_metadata_status` |
| Any → review_ready | Manual admin set | `admin.py:set_metadata_status` |
| review_ready → * | Manual override only | Not auto-recalculated |

Moderation actions (approve, reject, personal-only) no longer touch `metadata_status`. The two lifecycles are independent.

## Required Fields for `complete`

### Checked by `calculate_missing_fields` (`core/metadata.py`)

| Field | Source | Required | Missing behavior |
|-------|--------|----------|-----------------|
| `title` | `Book.title` | YES | Added to missing list if None or blank |
| `description` | `Book.description` | YES | Added if None or blank |
| `cover` | `Book.cover` | YES | Added if None or blank |
| `genres` | `book_genres` M:N → count | YES (≥1) | Added if `genre_count == 0` |
| `authors` | `book_authors` M:N → count | YES (≥1) | Added if `author_count == 0` |

The caller is responsible for passing M:N counts. The calculator does NOT read `Book.genres`, `Book.themes`, or `Book.motifs` directly.

### NOT checked (by design)

| Field | Source | Rationale |
|-------|--------|-----------|
| `themes` | `BookKnowledgeRelation` | Optional enrichment — not required for basic completeness |
| `motifs` | `BookKnowledgeRelation` | Optional enrichment |
| `concepts` | `BookKnowledgeRelation` | Optional enrichment |
| `atmospheres` | `BookKnowledgeRelation` | Optional enrichment |
| `subtitle` | `Book.subtitle` | Book-dependent — some books have no subtitle |
| `original_title` | `Book.original_title` | Only relevant for translated works |
| `original_language` | `Book.original_language` | Only relevant for translated works |
| `country_of_origin` | `Book.country_of_origin` | Optional metadata |
| `series_name` / `series_position` | Book.series_* | Series membership is optional |
| `total_pages` | `Book.total_pages` | Not universally available |
| `publication_type` | `Book.publication_type` | Has a default value |

## Enrichment Workflow

### Backend endpoints

| Endpoint | Action | Metadata impact |
|----------|--------|-----------------|
| `PUT /admin/metadata/books/{id}` | Save enrichment fields | Recalculates via `recalculate_metadata_status` |
| `PUT /admin/metadata/books/{id}/status` | Manual status override | Bypasses completeness check |
| `PUT /admin/books/{id}` | Save basic fields | Recalculates via `recalculate_metadata_status` |
| `POST /admin/books/{id}/authors` | Link author | Recalculates via `recalculate_metadata_status` |
| `DELETE /admin/books/{id}/authors/{author_id}` | Unlink author | Recalculates via `recalculate_metadata_status` |
| `POST /admin/books/{id}/taxonomy` | Connect taxonomy node | Recalculates via `recalculate_metadata_status` |
| `DELETE /admin/books/{id}/taxonomy/{relation_id}` | Disconnect taxonomy node | Recalculates via `recalculate_metadata_status` |
| `POST /admin/books` | Create book with genres | Recalculates via `recalculate_metadata_status` |

### Frontend flow (`BookEnrichmentPage.tsx`)

1. **Load:** Fetches `GET /admin/metadata/books/{id}` + `GET /admin/books/{id}/taxonomy`
2. **Save (Step 1):** `PUT /admin/books/{id}` — title, total_pages, publication_type
3. **Save (Step 2):** `PUT /admin/metadata/books/{id}` — subtitle, original_title, description, cover, genre_ids, language, country, year, series
4. **Themes/Motifs:** Managed via separate taxonomy endpoints (not sent in enrichment payload)
5. **Authors:** Managed via separate `/admin/books/{id}/authors` endpoints

### Metadata recalculation service (`metadata_service.py`)

All mutations go through `recalculate_metadata_status(db, book)`:

```python
async def recalculate_metadata_status(db, book):
    # Respects review_ready lock
    if book.metadata_status == "review_ready":
        return book.metadata_status

    author_count = get_book_author_count(db, book)     # from book_authors M:N
    genre_ids = get_book_genre_ids(db, book)            # from book_genres M:N
    genre_count = len(genre_ids)

    missing = calculate_missing_fields(book, author_count, genre_count)
    book.metadata_status = get_metadata_status(missing)
    return book.metadata_status
```

The service is called from:
- `update_metadata_book` (enrichment endpoint)
- `create_book` (admin)
- `update_book` (admin)
- `link_author_to_book` (admin_books)
- `unlink_author_from_book` (admin_books)
- `connect_book_to_node` (admin_taxonomy)
- `delete_book_relation` (admin_taxonomy)

### Enrichment endpoint fields

**Written directly to Book model:**
subtitle, original_title, description, cover,
original_language, country_of_origin, original_publication_year,
series_name, series_position

**Processed via M:N:**
genre_ids → sync_book_genres → updates book_genres + syncs Book.genres cache

**Removed from schema (no longer accepted):**
genres (list of string names), themes, motifs

**Computed after save:**
recalculate_metadata_status() using M:N sources

## Source-of-Truth Verification

### Correct sources

| Check | Source | Verified |
|-------|--------|----------|
| Author count | `book_authors` M:N | ✓ `get_book_author_count()` |
| Genre count | `book_genres` M:N | ✓ `get_book_genre_ids()` |
| Genre exists | `book_genres` → Genre | ✓ metadata checker uses counts |
| Cache sync | `sync_author_cache`, `sync_genre_cache` | ✓ called on every mutation |

### What does NOT affect metadata

- `Book.genres` JSON — ignored by calculator
- `Book.themes` — no reads or writes remain
- `Book.motifs` — no reads or writes remain
- `Book.author` — not read by calculator (authors checked via M:N count)
- `Book.author_id` — not read by calculator

## Proposed Taxonomy Completeness Rules

These are NOT implemented — only proposed for consideration.

### Option A: Keep taxonomy optional (current behavior)

- `themes`, `motifs`, `concepts`, `atmospheres` do NOT affect `metadata_status`
- Rationale: taxonomy is enrichment, not identity; some books may have no meaningful themes assigned

### Option B: Require at least one taxonomy relation for `complete`

- Add `taxonomy_count` parameter to `calculate_missing_fields`
- If `taxonomy_count == 0`, add "taxonomy" to missing fields
- Requires a `review_ready` → `complete` transition that only works when taxonomy is present

### Option C: Separate "enriched" status

- Introduce a parallel `enrichment_status` field (or extend metadata status values)
- Basic completeness (identity) uses current rules
- Full enrichment adds taxonomy requirement
- Allows progressive enrichment without blocking publication

## Completed Fixes

1. **`AdminBookEnrichment.genres` removed:** Dead schema field removed. Frontend no longer sends `genres` in enrichment payload — only `genre_ids` is sent.

2. **Taxonomy mutation triggers recalculation:** `connect_book_to_node` and `delete_book_relation` now call `recalculate_metadata_status`. All author and genre mutations also trigger recalculation.

3. **Approval preserves metadata:** `POST /moderation/books/{id}/approve` no longer resets `metadata_status` to `incomplete`. Moderation and metadata lifecycles are now independent.

## Remaining Issues

1. **`AdminBookEnrichment.genres` removed from input schema** but `AdminBookResponse.genres` (compatibility cache) and `AdminBookCreate.genres` / `AdminBookUpdate.genres` (legacy input) remain. These are intentional compatibility fields for the admin book create/update forms.
