# Syverro — Database Schema

## Architecture Overview

The database is divided into two logical layers within a single Room SQLite database:

1. **Global Catalog** — read-only data synced from Syverro Studio. Books, authors, genres, atmospheres, series, and their relations. The mobile app never writes to these tables directly.
2. **Personal User Data** — the user's own library, sessions, quotes, profile, and preferences. Written locally, synced to server asynchronously.

A third group of tables supports offline synchronization:
3. **Sync Infrastructure** — change queue, sync state, device identity.

```
┌─────────────────────────────────────┐
│         GLOBAL CATALOG              │
│  (read-only, synced from Studio)    │
│                                     │
│  catalog_books         ─┐           │
│  authors               ─┤           │
│  genres                ─┤ many-to-  │
│  atmospheres           ─┤ many      │
│  series                ─┘           │
│  catalog_book_authors               │
│  catalog_book_genres                │
│  catalog_book_atmospheres           │
│  catalog_book_series                │
└─────────────────────────────────────┘
                    │
                    │ user_book.catalog_book_id FK
                    ▼
┌─────────────────────────────────────┐
│       PERSONAL USER DATA            │
│  (user-owned, sync-capable)         │
│                                     │
│  user_books                         │
│  reading_sessions                   │
│  quotes                             │
│  user_profile                       │
│  user_preferences                   │
│  book_cover_cache                   │
│  active_session_state               │
└─────────────────────────────────────┘
                    │
                    │ change_queue references entity_id
                    ▼
┌─────────────────────────────────────┐
│       SYNC INFRASTRUCTURE           │
│                                     │
│  change_queue                       │
│  sync_state                         │
└─────────────────────────────────────┘
```

---

## Naming Conventions

- Table names: `snake_case`, plural
- Column names: `snake_case`
- Primary keys: `id TEXT` (UUID v4)
- Foreign keys: `{referenced_table_singular}_id`
- Timestamps: Unix epoch milliseconds (INTEGER)
- Soft delete: `deleted_at INTEGER` (nullable, NULL = active)

---

## Entity Relationship Diagram (Text)

```
catalog_books  1──*  catalog_book_authors  *──1  authors
catalog_books  1──*  catalog_book_genres   *──1  genres
catalog_books  1──*  catalog_book_atmospheres *──1 atmospheres
catalog_books  *──1  catalog_book_series  1──*  series

user_books     1──*  reading_sessions
user_books     1──*  quotes
user_books     1──1  book_cover_cache (optional)

user_profile   1──1  user_preferences
```

---

## 1. Global Catalog Tables

These tables are populated exclusively by syncing from Syverro Studio. The mobile app never inserts, updates, or deletes rows here. They serve as the lookup catalog from which users build their personal library.

### 1.1 `catalog_books`

The master book record from the curated catalog. A user references this record when adding a book to their personal library.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK, NOT NULL | UUID v4 |
| `title` | TEXT | NOT NULL | Primary title in original language |
| `title_transliterated` | TEXT | | Latin-script rendering of title |
| `subtitle` | TEXT | | Subtitle, if any |
| `original_language` | TEXT | ISO 639-1 | Language of original publication |
| `original_country` | TEXT | ISO 3166-1 alpha-2 | Country of original publication |
| `original_year` | INTEGER | | Year of first publication |
| `page_count` | INTEGER | | Total page count |
| `description` | TEXT | | Curator-written summary |
| `cover_url` | TEXT | | URL to cover image on Studio CDN |
| `isbn_10` | TEXT | UNIQUE | ISBN-10, if available |
| `isbn_13` | TEXT | UNIQUE | ISBN-13, if available |
| `goodreads_id` | TEXT | | External reference |
| `status` | TEXT | NOT NULL, DEFAULT 'published' | `published`, `draft`, `archived` |
| `created_at` | INTEGER | NOT NULL | Epoch ms |
| `updated_at` | INTEGER | NOT NULL | Epoch ms |

**Indexes:**
- `idx_catalog_books_title` on `title`
- `idx_catalog_books_isbn_10` on `isbn_10`
- `idx_catalog_books_isbn_13` on `isbn_13`
- `idx_catalog_books_status` on `status`

---

### 1.2 `authors`

Author identities. An author exists once and is referenced by all their books.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK, NOT NULL | UUID v4 |
| `name` | TEXT | NOT NULL | Canonical name |
| `name_native` | TEXT | | Name in native script (e.g., Cyrillic, Kanji) |
| `country` | TEXT | ISO 3166-1 alpha-2 | Country of origin |
| `birth_year` | INTEGER | | Year of birth |
| `death_year` | INTEGER | | Year of death (NULL if alive) |
| `biography` | TEXT | | Curator-written biographical summary |
| `portrait_url` | TEXT | | URL to portrait image on Studio CDN |
| `status` | TEXT | NOT NULL, DEFAULT 'published' | `published`, `draft`, `archived` |
| `created_at` | INTEGER | NOT NULL | Epoch ms |
| `updated_at` | INTEGER | NOT NULL | Epoch ms |

**Indexes:**
- `idx_authors_name` on `name`

---

### 1.3 `genres`

Genre taxonomy. Genres can be hierarchical (parent → child).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK, NOT NULL | UUID v4 |
| `name` | TEXT | NOT NULL | Canonical name |
| `description` | TEXT | | Curator definition |
| `parent_genre_id` | TEXT | FK → `genres.id`, NULLABLE | Hierarchical parent |
| `color` | TEXT | | Hex color for UI badges |
| `icon` | TEXT | | Icon identifier |
| `sort_order` | INTEGER | NOT NULL, DEFAULT 0 | Display ordering |
| `status` | TEXT | NOT NULL, DEFAULT 'published' | `published`, `draft`, `archived` |
| `created_at` | INTEGER | NOT NULL | Epoch ms |
| `updated_at` | INTEGER | NOT NULL | Epoch ms |

**Indexes:**
- `idx_genres_name` on `name`
- `idx_genres_parent` on `parent_genre_id`

---

### 1.4 `atmospheres`

Atmosphere taxonomy — the emotional/tonal qualities of books. Separate from genre.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK, NOT NULL | UUID v4 |
| `name` | TEXT | NOT NULL | E.g., "Melancholic", "Cozy", "Tense" |
| `description` | TEXT | | Definition and examples |
| `color` | TEXT | | Hex color for UI representation |
| `sort_order` | INTEGER | NOT NULL, DEFAULT 0 | Display ordering |
| `status` | TEXT | NOT NULL, DEFAULT 'published' | `published`, `draft`, `archived` |
| `created_at` | INTEGER | NOT NULL | Epoch ms |
| `updated_at` | INTEGER | NOT NULL | Epoch ms |

**Indexes:**
- `idx_atmospheres_name` on `name`

---

### 1.5 `series`

Book series. A series groups multiple books with optional position numbers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK, NOT NULL | UUID v4 |
| `name` | TEXT | NOT NULL | Series name |
| `description` | TEXT | | Optional description |
| `author_id` | TEXT | FK → `authors.id`, NULLABLE | Primary author of the series |
| `status` | TEXT | NOT NULL, DEFAULT 'published' | `published`, `draft`, `archived` |
| `created_at` | INTEGER | NOT NULL | Epoch ms |
| `updated_at` | INTEGER | NOT NULL | Epoch ms |

**Indexes:**
- `idx_series_name` on `name`

---

### 1.6 `catalog_book_authors`

Many-to-many join between catalog_books and authors.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK, NOT NULL | UUID v4 |
| `catalog_book_id` | TEXT | FK → `catalog_books.id`, NOT NULL | |
| `author_id` | TEXT | FK → `authors.id`, NOT NULL | |
| `position` | INTEGER | NOT NULL, DEFAULT 0 | Author ordering (first author = 0) |

**Indexes:**
- `idx_cba_book` on `catalog_book_id`
- `idx_cba_author` on `author_id`
- UNIQUE constraint on (`catalog_book_id`, `author_id`)

---

### 1.7 `catalog_book_genres`

Many-to-many join between catalog_books and genres.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK, NOT NULL | UUID v4 |
| `catalog_book_id` | TEXT | FK → `catalog_books.id`, NOT NULL | |
| `genre_id` | TEXT | FK → `genres.id`, NOT NULL | |

**Indexes:**
- `idx_cbg_book` on `catalog_book_id`
- `idx_cbg_genre` on `genre_id`
- UNIQUE constraint on (`catalog_book_id`, `genre_id`)

---

### 1.8 `catalog_book_atmospheres`

Many-to-many join between catalog_books and atmospheres.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK, NOT NULL | UUID v4 |
| `catalog_book_id` | TEXT | FK → `catalog_books.id`, NOT NULL | |
| `atmosphere_id` | TEXT | FK → `atmospheres.id`, NOT NULL | |

**Indexes:**
- `idx_cba_book` on `catalog_book_id`
- `idx_cba_atmo` on `atmosphere_id`
- UNIQUE constraint on (`catalog_book_id`, `atmosphere_id`)

---

### 1.9 `catalog_book_series`

Links a catalog book to a series with its position. A book can belong to at most one series (V1 constraint; may become many-to-many in future).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK, NOT NULL | UUID v4 |
| `catalog_book_id` | TEXT | FK → `catalog_books.id`, NOT NULL, UNIQUE | |
| `series_id` | TEXT | FK → `series.id`, NOT NULL | |
| `position` | INTEGER | | Position within series (1-based) |

**Indexes:**
- `idx_cbs_book` on `catalog_book_id`
- `idx_cbs_series` on `series_id`
- UNIQUE constraint on (`catalog_book_id`, `series_id`)

---

## 2. Personal User Data Tables

These tables store the user's own library and activity. They are the primary tables queried by the mobile app. All support offline operation.

### 2.1 `user_books`

A book in the user's personal library. Created when the user adds a book — either from the catalog (referencing `catalog_book_id`) or as a custom entry (when no catalog record exists).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK, NOT NULL | UUID v4 |
| `catalog_book_id` | TEXT | FK → `catalog_books.id`, NULLABLE | Reference to catalog, NULL for custom entries |
| `title` | TEXT | NOT NULL | User-facing title (may differ from catalog) |
| `author` | TEXT | NOT NULL | User-facing author string (may differ from catalog) |
| `status` | TEXT | NOT NULL, DEFAULT 'planned' | `planned`, `reading`, `finished`, `postponed`, `abandoned`, `rereading` |
| `rating` | INTEGER | | 1–5, NULL = unrated |
| `total_pages` | INTEGER | NOT NULL, DEFAULT 0 | |
| `current_page` | INTEGER | NOT NULL, DEFAULT 0 | |
| `start_date` | TEXT | | ISO date string (YYYY-MM-DD) |
| `end_date` | TEXT | | ISO date string (YYYY-MM-DD) |
| `notes` | TEXT | NOT NULL, DEFAULT '' | Personal notes |
| `review` | TEXT | NOT NULL, DEFAULT '' | Personal review |
| `favorite` | INTEGER | NOT NULL, DEFAULT 0 | Boolean: 0 or 1 |
| `reading_format` | TEXT | NOT NULL, DEFAULT 'reading' | `reading`, `listening` |
| `genres` | TEXT | NOT NULL, DEFAULT '' | Comma-separated genre strings (denormalized for fast display) |
| `languages` | TEXT | NOT NULL, DEFAULT '' | Comma-separated language codes |
| `cover_uri` | TEXT | | Local file URI for cover image (if user-added) |
| `author_country` | TEXT | | Country name string |
| `series` | TEXT | | Series name string |
| `series_position` | INTEGER | | |
| `original_year` | INTEGER | | |
| `last_read` | INTEGER | | Epoch ms of last reading session |
| `section` | TEXT | | User-defined grouping |
| `created_at` | INTEGER | NOT NULL | Epoch ms |
| `updated_at` | INTEGER | NOT NULL | Epoch ms |
| `deleted_at` | INTEGER | | Soft delete, NULL = active |

**Indexes:**
- `idx_user_books_status` on `status`
- `idx_user_books_favorite` on `favorite`
- `idx_user_books_title` on `title`
- `idx_user_books_author` on `author`
- `idx_user_books_created_at` on `created_at`
- `idx_user_books_catalog` on `catalog_book_id`
- `idx_user_books_deleted` on `deleted_at`

---

### 2.2 `reading_sessions`

A timed reading session linked to a user book.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK, NOT NULL | UUID v4 |
| `user_book_id` | TEXT | FK → `user_books.id`, NOT NULL | |
| `start_page` | INTEGER | NOT NULL | Page when session started |
| `end_page` | INTEGER | NOT NULL | Page when session ended |
| `pages_read` | INTEGER | NOT NULL | Derived: end_page − start_page |
| `duration_seconds` | INTEGER | NOT NULL | Elapsed reading time (excluding pauses) |
| `started_at` | INTEGER | NOT NULL | Epoch ms when timer started |
| `ended_at` | INTEGER | NOT NULL | Epoch ms when session ended |
| `status` | TEXT | NOT NULL, DEFAULT 'completed' | `completed` |
| `created_at` | INTEGER | NOT NULL | Epoch ms |
| `updated_at` | INTEGER | NOT NULL | Epoch ms |
| `deleted_at` | INTEGER | | Soft delete, NULL = active |

**Indexes:**
- `idx_sessions_book` on `user_book_id`
- `idx_sessions_started_at` on `started_at`
- `idx_sessions_deleted` on `deleted_at`

---

### 2.3 `quotes`

A quote captured during a reading session or added manually.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK, NOT NULL | UUID v4 |
| `user_book_id` | TEXT | FK → `user_books.id`, NOT NULL | |
| `reading_session_id` | TEXT | FK → `reading_sessions.id`, NULLABLE | Session during which quote was captured |
| `text` | TEXT | NOT NULL | Quote content |
| `page` | INTEGER | | Page number where quote appears |
| `note` | TEXT | | User's personal comment on the quote |
| `session_time_minutes` | INTEGER | | Reading time elapsed when quote was captured |
| `created_at` | INTEGER | NOT NULL | Epoch ms |
| `updated_at` | INTEGER | NOT NULL | Epoch ms |
| `deleted_at` | INTEGER | | Soft delete, NULL = active |

**Indexes:**
- `idx_quotes_book` on `user_book_id`
- `idx_quotes_session` on `reading_session_id`
- `idx_quotes_deleted` on `deleted_at`
- FTS index on `text` for full-text search (Room FTS4)

---

### 2.4 `user_profile`

The user's profile metadata. One row per user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK, NOT NULL | UUID v4 |
| `display_name` | TEXT | NOT NULL, DEFAULT 'Reader' | |
| `avatar_emoji` | TEXT | | Emoji character for avatar |
| `avatar_uri` | TEXT | | Local file URI for custom avatar image |
| `bio` | TEXT | | Short personal bio |
| `member_since` | INTEGER | NOT NULL | Epoch ms of account creation |
| `created_at` | INTEGER | NOT NULL | Epoch ms |
| `updated_at` | INTEGER | NOT NULL | Epoch ms |

---

### 2.5 `user_preferences`

User settings and app preferences. Key-value pairs with typed columns for the most common preferences, plus a JSON blob for future extensions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK, NOT NULL | Fixed value: `'default'` (single-row table) |
| `theme_mode` | TEXT | NOT NULL, DEFAULT 'dark' | `light`, `dark`, `system` |
| `language_code` | TEXT | NOT NULL, DEFAULT 'ru' | `ru`, `en`, `be`, `ua` |
| `active_book_id` | TEXT | FK → `user_books.id`, NULLABLE | Currently active reading book |
| `extras_json` | TEXT | | JSON blob for future preference keys |
| `updated_at` | INTEGER | NOT NULL | Epoch ms |

---

### 2.6 `book_cover_cache`

Tracks locally cached cover images. Mobile app downloads covers from the catalog CDN and stores them locally for offline viewing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK, NOT NULL | UUID v4 |
| `entity_type` | TEXT | NOT NULL | `catalog_book`, `user_book` |
| `entity_id` | TEXT | NOT NULL | FK to respective table |
| `source_url` | TEXT | NOT NULL | Original URL |
| `local_file_path` | TEXT | NOT NULL | Path to local cached file |
| `file_size_bytes` | INTEGER | | |
| `cached_at` | INTEGER | NOT NULL | Epoch ms |

**Indexes:**
- UNIQUE constraint on (`entity_type`, `entity_id`)
- `idx_cover_cache_entity` on (`entity_type`, `entity_id`)

---

### 2.7 `active_session_state`

Persists the state of an in-progress reading session so the timer can survive app restart.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK, NOT NULL | Fixed value: `'current'` (single-row table) |
| `user_book_id` | TEXT | FK → `user_books.id`, NOT NULL | |
| `start_page` | INTEGER | NOT NULL | |
| `started_at` | INTEGER | NOT NULL | Epoch ms when timer started |
| `paused_duration_ms` | INTEGER | NOT NULL, DEFAULT 0 | Cumulative pause time in ms |
| `is_paused` | INTEGER | NOT NULL, DEFAULT 0 | Boolean: 0 or 1 |
| `paused_since` | INTEGER | | Epoch ms when current pause began, NULL if not paused |
| `updated_at` | INTEGER | NOT NULL | Epoch ms |

**Constraints:** At most one row. Deleting this row means no active session.

---

## 3. Sync Infrastructure Tables

Not required for V1 MVP (offline-only). Included in the schema from the start to avoid migration later.

### 3.1 `change_queue`

Records local changes that need to be synced to the server. Append-only. Rows are deleted after successful sync confirmation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `op_id` | TEXT | PK, NOT NULL | UUID v4 |
| `entity_type` | TEXT | NOT NULL | `user_book`, `reading_session`, `quote`, `user_profile` |
| `entity_id` | TEXT | NOT NULL | ID of the affected row |
| `operation` | TEXT | NOT NULL | `create`, `update`, `delete` |
| `payload` | TEXT | NOT NULL | JSON snapshot of the entity at time of change |
| `status` | TEXT | NOT NULL, DEFAULT 'pending' | `pending`, `sent`, `failed` |
| `retry_count` | INTEGER | NOT NULL, DEFAULT 0 | |
| `device_id` | TEXT | NOT NULL | |
| `created_at` | INTEGER | NOT NULL | Epoch ms |
| `updated_at` | INTEGER | NOT NULL | Epoch ms |

**Indexes:**
- `idx_change_queue_status` on `status`
- `idx_change_queue_created` on `created_at`

---

### 3.2 `sync_state`

Tracks the server sync cursor and device identity.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, NOT NULL, DEFAULT 1 | Fixed single row |
| `device_id` | TEXT | NOT NULL | Persistent device UUID |
| `last_cursor` | TEXT | | Server sync cursor |
| `last_sync_at` | INTEGER | | Epoch ms of last successful sync |
| `created_at` | INTEGER | NOT NULL | Epoch ms |
| `updated_at` | INTEGER | NOT NULL | Epoch ms |

**Constraints:** Single-row table (`id = 1`). Inserted on first launch.

---

## 4. Schema Version and Migration Strategy

| Version | Changes |
|---------|---------|
| 1 | Initial schema: all personal tables + sync infrastructure |
| 2 | Add global catalog tables (when Studio sync is introduced) |

**Rules:**
- V1 ships with all personal tables, sync infrastructure, and *empty* catalog tables (schema ready, data absent).
- Catalog tables are populated by the first Studio sync — no migration needed.
- Migrations are additive only. No destructive migrations in V1.
- Each migration is tested against a database with 10,000 seed rows.

---

## 5. Query Patterns

### Library grid (3-column)
```sql
SELECT id, title, author, cover_uri, rating, favorite, status
FROM user_books
WHERE deleted_at IS NULL
  AND (title LIKE '%query%' OR author LIKE '%query%')
  AND (status = :filter OR :filter = 'all')
ORDER BY
  CASE :sort
    WHEN 'date' THEN created_at
    WHEN 'title' THEN title
    WHEN 'author' THEN author
    WHEN 'rating' THEN rating
    WHEN 'progress' THEN CAST(current_page AS REAL) / MAX(total_pages, 1)
  END DESC
```

### Active book (dashboard)
```sql
SELECT ub.* FROM user_books ub
JOIN user_preferences up ON up.active_book_id = ub.id
WHERE ub.deleted_at IS NULL
LIMIT 1;
```

### Session history (last 10)
```sql
SELECT * FROM reading_sessions
WHERE user_book_id = :bookId AND deleted_at IS NULL
ORDER BY started_at DESC
LIMIT 10;
```

### Weekly activity (statistics)
```sql
SELECT CAST(strftime('%w', started_at / 1000, 'unixepoch') AS INTEGER) AS weekday,
       SUM(duration_seconds) AS total_seconds
FROM reading_sessions
WHERE deleted_at IS NULL
  AND started_at > :sinceTimestamp
GROUP BY weekday
ORDER BY weekday;
```

### Top genres
```sql
SELECT genres, COUNT(*) AS count
FROM user_books
WHERE status IN ('finished', 'reading', 'rereading')
  AND deleted_at IS NULL
  AND genres != ''
GROUP BY genres
ORDER BY count DESC
LIMIT 3;
```

### Quotes by book
```sql
SELECT * FROM quotes
WHERE user_book_id = :bookId AND deleted_at IS NULL
ORDER BY created_at DESC;
```

---

## 6. Constraints and Business Rules Enforced at Database Level

| Rule | Enforcement |
|------|-------------|
| A book cannot be in two statuses simultaneously | Single `status` column per row |
| Soft delete is used for all personal entities | `deleted_at` column; queries filter `WHERE deleted_at IS NULL` |
| At most one active session at any time | Single-row `active_session_state` table |
| Session cannot reference a deleted book | FK → `user_books.id` with ON DELETE CASCADE |
| Quote cannot reference a deleted session | FK → `reading_sessions.id` with ON DELETE SET NULL |
| User preferences are a single row | PK fixed to `'default'` |
| Catalog joins are unique | Composite UNIQUE constraints on join tables |
| ISBN uniqueness | UNIQUE constraint on `catalog_books.isbn_10` and `.isbn_13` |
| Cover cache is one-to-one per entity | UNIQUE constraint on (`entity_type`, `entity_id`) |