# Frontend Book API Contract

## Canonical Fields

Fields backed by M:N source-of-truth tables. These are the preferred fields for all
business logic.

### Authors (source: `book_authors` M:N)

| Type | Field | Shape | Notes |
|------|-------|-------|-------|
| GlobalBook | `authors?` | `string[]` | Author names (legacy compat, not populated from API yet) |
| AdminBook | `authors` | `{ id, name, country? }[]` | Full author objects with IDs |
| AdminBookCreate | `author_id?` | `string` | UUID of linked author |
| AdminBookUpdate | `author_id?` | `string` | UUID of linked author |

**Admin flows:** use `author_id` to link authors via `link_author`/`unlink_author` endpoints.
The `author` compat string is synced automatically by the backend.

### Genres (source: `book_genres` M:N)

| Type | Field | Shape | Notes |
|------|-------|-------|-------|
| GlobalBook | `genreIds?` | `string[]` | Genre UUIDs |
| GlobalBook | `genreObjects?` | `{ id, name, slug }[]` | Full genre objects. **Preferred for filtering.** |
| AdminBook | `genre_ids` | `string[]` | Genre UUIDs |
| AdminBook | `genre_objects` | `{ id, name, slug }[]` | Full genre objects |

**Admin flows:** use `genre_ids` in create/update mutations. The enrichment endpoint
(`/admin/metadata/{id}/enrich`) accepts `genre_ids` only.

### Taxonomy (source: `BookKnowledgeRelation` M:N → `KnowledgeNode`)

| Type | Field | Shape | Notes |
|------|-------|-------|-------|
| GlobalBook | `themes` | `string[]` | Theme slugs/names (populated from M:N by backend) |
| GlobalBook | `motifs` | `string[]` | Motif slugs/names (populated from M:N by backend) |

**Admin flows:** use `/admin/taxonomy/connect-book` and `/admin/taxonomy/delete-book-relation`
endpoints to manage taxonomy relations.

## Compatibility Fields

Fields that remain for backward compatibility. They are kept in sync with the M:N
source-of-truth by backend cache sync hooks. **Do not use for business logic.**

| Field | Types | Reason |
|-------|-------|--------|
| `author` | `GlobalBook.author`, `AdminBook.author`, `AdminBookCreate.author`, `AdminBookUpdate.author` | Display-only; synced from `book_authors` M:N via `sync_author_cache()` |
| `author_id` | `AdminBook.author_id` | Legacy FK; kept for select queries |
| `genres` | `GlobalBook.genres`, `AdminBook.genres`, `AdminBookCreate.genres`, `AdminBookUpdate.genres`, `AdminBookResponse.genres` | Display-only; synced from `book_genres` M:N via `sync_genre_cache()` |

### Usage classification

Every frontend usage of these fields falls into one of two categories:

**A) Compatibility display** — safe to keep, no migration needed:
- `BookHeader.tsx:65` — `{book.author}`
- `BookHeader.tsx:97-99` — `book.genres` tag list
- `BookMeta.tsx:20-22` — `book.genres` tag list
- `BookPage/index.tsx:123` — `{book.author}`
- `BookPage/index.tsx:279-281` — `book.genres` taglist
- `BookCard.tsx:109` — `{book.author}`
- `LibraryGrid.tsx:139`, `LibraryList.tsx:89` — `{book.author}`
- `BooksTable.tsx:166` — `{book.author}` display
- `BooksTable.tsx:170` — `book.genres` tags
- `MetadataPage.tsx:177` — `{book.author}`
- `ModerationPage.tsx:301` — `{book.author}`
- `ModerationPage.tsx:449` — `book.genres` display
- `BookEnrichmentPage.tsx:358` — `{book.author}`
- All `EditModal` form init fields (local state only, no backend write)

**B) Business logic** — should use canonical sources:

| File | Field | Migrated to | Status |
|------|-------|-------------|--------|
| useLibraryFilters.ts:95 | `book.genres` → allGenres set | `book.genreObjects?.map(g => g.name) \|\| book.genres` | Done |
| useLibraryFilters.ts:131 | `book.genres` → filter | `bookGenreNames.some(...)` via `genreObjects` | Done |
| useLibraryFilters.ts:123 | `book.author` → search | No canonical `authors` populated yet | Deferred |
| useLibraryFilters.ts:139 | `book.themes` → filter | Canonical — backed by M:N taxonomy | No change needed |
| useLibrary.ts:33,46 | `book.author` → addToLibrary | No canonical alternative in public book creation | Deferred |
| bookApi.ts:67 | `data.author` → POST /books/ | Backend compat field, required for creation | Deferred |

## Deprecated Fields

These fields have zero runtime usage in the frontend. They remain in the TypeScript
types but are never read or written by any component.

- `book.subgenres` — never populated from API (static data only)

## API Response Shape

The backend `BookResponse` (public `/books/` endpoints) now returns these fields
that were previously dropped by the frontend mapping:

- `themes: string[]` — populated from M:N `BookKnowledgeRelation`
- `motifs: string[]` — populated from M:N `BookKnowledgeRelation`
- `subgenres: string[]` — returned as-is
- `mood: string[]` — returned as-is
- `vibe: string[]` — returned as-is
- `subtitle: string | null` — returned as-is
- `original_language: string | null` — returned as-is
- `original_publication_year: number | null` — returned as-is
- `series_name: string | null` — returned as-is
- `series_position: number | null` — returned as-is

The frontend mapping in `bookApi.ts::mapBookResponseToGlobalBook` now maps all of
these, fixing the gap where `themes`/`motifs` were silently dropped.

## Verification

```bash
npm run build    # must pass
grep audit:
  .author — 22 hits (13 display, 2 Admin create, 3 addToLibrary, 1 filter, 3 form init)
  .genres — 11 hits (6 display, 3 Admin create, 1 filter, 1 form init)
  .themes — 5 hits (3 display, 1 filter, 1 form init)
  .motifs — 4 hits (3 display, 1 form init)
```
