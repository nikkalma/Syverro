# Authors Module

## Data Model

### SQLAlchemy Model (`backend/app/models/author.py`)

Columns in `authors` table:

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK, auto-generated |
| name | String | Required, indexed. Display name fallback |
| first_name | String | Nullable |
| middle_name | String | Nullable |
| last_name | String | Nullable |
| native_name | String | Nullable |
| sort_name | String | Nullable |
| display_name | String | Nullable. Primary display name |
| display_name_mode | String | Nullable. Values: real_name, birth_name, pen_name, custom |
| pen_names | String[] | ARRAY, default `{}` |
| birth_name | String | Nullable |
| slug | String | Nullable, unique, indexed |
| search_aliases | Text | Nullable. Pipe-delimited search variants |
| pseudonyms | String[] | ARRAY, default `{}`. Legacy, kept for compatibility |
| nationality | String | Nullable |
| country | String | Nullable. Legacy alias for nationality |
| languages | String[] | ARRAY |
| gender | String | Default `unknown` |
| official_website | String | Nullable |
| wikipedia_url | String | Nullable |
| bio | Text | Nullable |
| birth_year | Integer | Nullable |
| death_year | Integer | Nullable |
| birth_date | String | Nullable. Format: YYYY-MM-DD |
| death_date | String | Nullable. Format: YYYY-MM-DD |
| birth_place | String | Nullable |
| death_place | String | Nullable |
| occupations | String[] | ARRAY |
| literary_movements | String[] | ARRAY |
| active_from_year | Integer | Nullable |
| active_to_year | Integer | Nullable |
| notable_works | String[] | ARRAY |
| genres | String[] | ARRAY |
| writing_languages | String[] | ARRAY |
| photo | String | Nullable. URL |
| gallery | String[] | ARRAY. URLs |
| signature_image | String | Nullable. URL |
| portrait_caption | String | Nullable |
| creation_type | String | Default: `individual_author` |
| created_at | DateTime | Auto |
| updated_at | DateTime | Auto on update |

Relationships:
- `awards` → `AuthorAward` (one-to-many, cascade delete)
- `books` → `Book` via `Book.author_id` (legacy one-to-many)
- `book_refs` → `Book` via `book_authors` (many-to-many)

### AuthorAward (`backend/app/models/author_award.py`)

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| author_id | UUID | FK → authors.id, CASCADE |
| name | String | Required |
| year | Integer | Nullable |
| organization | String | Nullable |
| work | String | Nullable |
| created_at | DateTime | Auto |

## API Contracts

### Admin Endpoints (`/admin/authors`)

All require `owner`, `admin`, or `moderator` role.

#### GET /admin/authors — List authors
- Query params: `page`, `limit`, `search`, `country`
- Returns: `{ data: AuthorBrief[], total, page, limit, total_pages }`
- Response field `awards`: NOT included (perf optimization)
- Response field `country`: populated from `nationality` (backward compat)

#### GET /admin/authors/{id} — Author detail
- Returns: full author object including `awards[]`

#### POST /admin/authors — Create author
- Body: `AuthorCreate` schema (all AuthorBase fields + `awards[]`)
- Validates: slug format, slug uniqueness, date constraints, name uniqueness
- Awards are persisted in `author_awards` table
- Returns: `{ id, message, slug, awards[] }`

#### PUT /admin/authors/{id} — Update author
- Body: `AuthorUpdate` schema (partial, all fields optional + `awards[]`)
- Validates: slug format, slug uniqueness (excl. current), date constraints
- Awards: atomically replaced (delete all + insert new)
- Returns: `{ message, awards[] }`

#### DELETE /admin/authors/{id}
- Validates: no books linked
- Returns: `{ message }`

### Public Endpoints (`/authors`)

#### GET /authors — Public author list
- Returns: `AuthorListBrief[]` (id, slug, name, first_name, last_name, native_name, biography_excerpt, photo_url, nationality)

#### GET /authors/{slug_or_id} — Public author detail
- Accepts: slug string or UUID
- Returns: `AuthorPublicResponse` (id, display_name, display_name_mode, name, bio, dates, photo_url, books, metadata)

## Display Name Logic

### Frontend (`types/admin.ts:161-180`)

```typescript
function computeDisplayName(mode, firstName, lastName, middleName, birthName, penNames, customDisplayName)
```

Modes:
- `real_name`: `[firstName, middleName, lastName].filter(Boolean).join(' ')`
- `birth_name`: `birthName`
- `pen_name`: `penNames[0]`
- `custom`: `customDisplayName`

### Fallback chain (in AuthorModal submit and public page):

1. `display_name` (from DB)
2. `computedDisplayName` (from mode + fields)
3. `[firstName, lastName].filter(Boolean).join(' ')`
4. `birthName`
5. `penNames[0]`
6. `author.name` (DB fallback)

## Slug Rules

### Generation

Frontend `slugify()`:
1. Transliterate Cyrillic → Latin
2. Lowercase
3. Remove non-alphanumeric chars (except hyphens)
4. Whitespace/underscores → hyphens
5. Trim leading/trailing hyphens

### Auto-generation

- Runs when `computedDisplayName` changes
- Disabled when `slugManuallyEdited.current === true`
- Set to `true` when loading existing slug in edit mode
- Reset button sets `slugManuallyEdited.current = false`

### Collision handling

Backend validates slug uniqueness on POST/PUT.
Collision returns 400: "Slug already in use".

## Known Backend Dependencies

1. **Alembic migration `0006_author_identity_fields`** must be applied
   - Adds: `display_name`, `display_name_mode`, `pen_names`, `birth_name`, `slug`, `search_aliases`

2. **Refresh token TTL** should be >= 30 days
   - Frontend apiClient handles auto-refresh on 401
   - Refresh URL: `POST /auth/refresh?refresh_token=...`
   - Backend must return `{ access_token, refresh_token }`

3. **No backend tests exist** for author endpoints

## Frontend Fields

### Admin fields (types/admin.ts)

- `AdminAuthor` — full author object from API
- `AdminAuthorCreate` — fields sent in POST/PUT body (all optional except `name`)
- `AuthorAward` — award object

### Modal component state

Every modal state field maps 1:1 to an API field.
See `AuthorModal.tsx` lines 91-144 for state declarations.

### Author table

`AuthorsTable.tsx` shows:
- Photo (avatar or initial)
- Name (clickable → public page)
- Country
- Book count
- Created date
- Actions: View, Edit, Delete
