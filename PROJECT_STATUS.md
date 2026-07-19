# PROJECT_STATUS.md — Syverro

> Auto-generated technical report — 2026-07-19

---

## 1. Project Structure

```
Syverro/
├── App.tsx                  # Expo root entry (STALE — references ./mobile-app/src/)
├── app.json / eas.json      # Expo config
├── package.json             # Root Expo deps (incomplete — no scripts)
├── tsconfig.json            # Root TS config
├── docker-compose.yml       # Postgres + Backend
├── .env / .env.example      # Environment
├── brand/                   # Logo SVGs
├── backend/                 # Python FastAPI
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── railway.json / Procfile / runtime.txt
│   └── app/
│       ├── main.py
│       ├── config.py / database.py
│       ├── core/            # security.py, deps.py
│       ├── models/          # 9 SQLAlchemy models
│       ├── schemas/         # Pydantic schemas
│       └── api/             # auth, books, sync, admin routers
├── web/                     # React 18 + Vite + Tailwind v4
│   ├── src/
│   │   ├── App.tsx / main.tsx
│   │   ├── pages/           # Library, Login, Register, Profile, Settings, Admin/*
│   │   ├── components/      # Layout, AdminLayout, shared UI
│   │   ├── store/           # Zustand stores (auth, books, admin, library)
│   │   ├── shared/api/      # Axios client
│   │   ├── services/        # localStorage storageService
│   │   ├── hooks/           # useLibrary, useOffline
│   │   ├── locales/         # 6 languages
│   │   └── lib/offline/     # Offline event queue
│   ├── vite.config.ts
│   ├── vercel.json
│   └── tailwind.config.js
└── mobile/                  # React Native Expo SDK 54
    └── src/
        ├── navigation/      # AppNavigator (tabs + stacks)
        ├── screens/         # Auth, Profile, Library, Session, Settings, BookDetails, Quotes, ...
        ├── store/           # Zustand over SQLite
        ├── services/        # API client, auth, book services
        ├── sync/            # Sync engine (STUB)
        └── context/         # Theme, Language, Lighting
```

---

## 2. Web Application State

| Feature | Status | Notes |
|---------|--------|-------|
| Library (catalog browsing) | **Working** | localStorage-backed, seeded from `data/books.json` |
| Login / Register | **Working** | JWT-based via `/auth/*` |
| Profile page | **Working** | Reader identity section (vibes, themes, motifs, genres) |
| Settings | **Working** | Theme, locale, display name (localStorage) |
| Book detail page | **Broken** | Component exists but **no `<Route>` in App.tsx** — navigating to `/book/:id` renders nothing |
| My Library page | **Broken** | Component exists but **no `<Route>` in App.tsx** |
| Insights page | **Placeholder** | "Coming soon" |
| World Map page | **Placeholder** | "In development" |
| Suggest Book | **Partial** | Saves to localStorage only, no API call |
| Offline event sync | **Partial** | Posts to `/events/sync` but no backend route exists |

---

## 3. Admin Panel State

| Feature | Status | Notes |
|---------|--------|-------|
| AdminRoute guard | **Working** | Role hierarchy: owner > admin > moderator > user |
| Dashboard | **Working** | Stats + recent users; uses raw `fetch()` |
| User management | **Working** | CRUD, role change, block/unblock, delete |
| Book management | **Working** | CRUD, publish/unpublish |
| Author management | **Working** | CRUD, deletion blocked if author has books |
| Genre management | **Working** | CRUD with auto-slug |
| Logs | **Stub** | Backend returns empty arrays — no Log model |
| Settings | **Working** | Stored in-memory — lost on restart |
| Moderation/Suggestions | **Partial** | localStorage-based, not connected to API |
| Admin sub-routes | **Broken** | `/admin/users`, `/admin/books` etc. have **no `<Route>` in App.tsx** — the admin layout links navigate but routes don't exist |

---

## 4. Authentication & Authorization

### Flow
1. **Register** → POST `/auth/register` (email + password) → auto-login
2. **Login** → POST `/auth/login` → JWT token (30 min expiry) → GET `/auth/me`
3. **Token storage**: localStorage (web), AsyncStorage (mobile)
4. **Axios interceptor**: auto-attaches `Authorization: Bearer <token>`
5. **401 handling**: interceptor clears token, redirects to `/login`

### Role system
- `owner` (level 4): full access, can delete users, manage settings
- `admin` (level 3): manage users (not delete), books, authors, genres
- `moderator` (level 2): same as admin in current implementation
- `user` (level 1): standard access

### Issues
- **CRITICAL**: `security.py:8` hardcodes `SECRET_KEY = "your-secret-key-change-this-in-production"` — the env var from `config.py` is never imported. JWTs signed with wrong key.
- No token refresh — tokens simply expire, forcing re-login.
- Telegram auth endpoint exists but **never validates the hash**.
- User model has redundant `is_admin` and `is_moderator` booleans alongside `role` string — booleans are never used.

---

## 5. Database Schema

**PostgreSQL 15**, async SQLAlchemy + asyncpg. Schema auto-created via `Base.metadata.create_all()` at startup. **No Alembic migrations exist** despite `alembic` being in requirements.txt.

| Model | Table | Key Fields |
|-------|-------|------------|
| **User** | `users` | id (UUID), email (unique), phone (unique, nullable), password_hash, role, is_active |
| **Book** | `books` | id (UUID), title, author (string), author_id (FK), cover, genres (JSON), total_pages, is_published, version, deleted_at |
| **UserBook** | `user_books` | user_id (FK), book_id (FK), status, rating, current_page, is_favorite, version, deleted_at |
| **Author** | `authors` | id (UUID), name, photo, bio, country, birth_year, death_year |
| **Genre** | `genres` | id (UUID), name (unique), slug (unique), description, book_count |
| **ReadingSession** | `reading_sessions` | user_id, book_id, book_title, book_author, start/end_page, duration_seconds, date, status |
| **Quote** | `quotes` | user_id, book_id, text (Text), page, note, session_id (FK) |
| **SyncState** | `sync_state` | user_id (PK+FK), last_sync_cursor, device_id |
| **ChangeLog** | `change_log` | user_id, op_id, entity_type, entity_id, operation, payload (JSON), device_id |

### Issues
- `Author` model uses deprecated `datetime.utcnow()` instead of `func.now()`.
- No foreign key from Book to Author is enforced at DB level for the `author` string field (only `author_id` FK exists).
- `Genre.book_count` is a denormalized counter that must be manually maintained.

---

## 6. API Endpoints (Admin)

| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | `/admin/stats` | mod+ | Dashboard statistics |
| GET | `/admin/users` | mod+ | Paginated users (search, role, status filters) |
| GET | `/admin/users/recent` | mod+ | Recent users |
| GET | `/admin/users/{id}` | mod+ | User detail |
| PUT | `/admin/users/{id}` | mod+ | Update user (phone only) |
| PUT | `/admin/users/{id}/role` | mod+ | Change role |
| PUT | `/admin/users/{id}/block` | mod+ | Block/unblock |
| DELETE | `/admin/users/{id}` | owner | Delete user |
| POST | `/admin/users/{id}/logout` | mod+ | **Stub** — no-op |
| GET | `/admin/books` | mod+ | Paginated books |
| GET | `/admin/books/{id}` | mod+ | Book detail |
| POST | `/admin/books` | mod+ | Create book |
| PUT | `/admin/books/{id}` | mod+ | Update book |
| PUT | `/admin/books/{id}/publish` | mod+ | Toggle publish |
| DELETE | `/admin/books/{id}` | mod+ | Delete book |
| GET | `/admin/authors` | mod+ | Paginated authors |
| GET | `/admin/authors/{id}` | mod+ | Author detail |
| POST | `/admin/authors` | mod+ | Create author |
| PUT | `/admin/authors/{id}` | mod+ | Update author |
| DELETE | `/admin/authors/{id}` | mod+ | Delete author (blocked if has books) |
| GET | `/admin/genres` | mod+ | Paginated genres |
| GET | `/admin/genres/{id}` | mod+ | Genre detail |
| POST | `/admin/genres` | mod+ | Create genre |
| PUT | `/admin/genres/{id}` | mod+ | Update genre |
| DELETE | `/admin/genres/{id}` | mod+ | Delete genre |
| GET | `/admin/logs` | mod+ | **Stub** — returns empty |
| GET | `/admin/logs/recent` | mod+ | **Stub** — returns empty |
| GET | `/admin/settings` | owner | Get settings (in-memory) |
| PUT | `/admin/settings` | owner | Update settings (in-memory) |

---

## 7. TODOs & Unfinished Features

### Backend
- `sync.py:274` — `# TODO: add pending_changes table or use change_log`
- `admin.py:367` — `# TODO: implement session clearing` (logout_user_sessions is a no-op)
- `admin.py:867` — `# TODO: implement Log model for storing logs`
- `sync.py:461-470` — `process_session_change` and `process_quote_change` are stubs (always return "applied")
- Admin settings are stored in a module-level Python variable — reset on every restart
- No Alembic migrations despite being in requirements.txt
- Telegram auth has no hash verification

### Web
- `pages/Insights.tsx` — placeholder ("Coming soon")
- `pages/WorldMap.tsx` — placeholder ("In development")
- `pages/BookPage` — inline reader marked "Function under development"
- `api/insights.ts` and `api/worlds.ts` — empty files
- BookPage and MyLibraryPage components exist but are **not routed**
- Admin sub-routes (`/admin/users`, `/admin/books`, etc.) are **not routed**
- Offline event sync posts to `/events/sync` but backend has no such endpoint
- SuggestBook saves to localStorage only, no API persistence

### Mobile
- `store/index.ts:16` — `# TODO: move to types/ when created`
- `store/index.ts:120-188` — sessions, quotes, profile methods are all `console.log` stubs
- `sync/syncAPI.ts` — entire file is a mock; `API_BASE` points to `http://localhost:3000` (non-existent server)

---

## 8. Broken Functionality & Bugs

### Critical
1. **Hardcoded secret key** (`backend/app/core/security.py:8`) — `SECRET_KEY` is a local constant, bypassing `config.py`. JWTs signed with `"your-secret-key-change-this-in-production"`.
2. **Hardcoded user ID** (`web/src/pages/BookPage/index.tsx:14`, `web/src/hooks/useLibrary.ts:7`) — `CURRENT_USER_ID = 'user_1'`. All web users share the same local library data.
3. **Missing routes** — `BookPage`, `MyLibraryPage`, and all admin sub-pages are navigated to but have no `<Route>` in `App.tsx`. Users see blank pages.
4. **Duplicate import** (`web/src/store/libraryStore.ts:5-6`) — `storageService` imported twice. TypeScript compilation error.
5. **`storageService.add()` doesn't exist** (`web/src/pages/BookPage/index.tsx:60`) — method is called but `storageService` only has `addPersonalBook()`. Runtime error.

### Security
6. `.env` is committed to git with `change-me` defaults.
7. Telegram auth receives hash but never verifies it.
8. Admin settings stored in-memory — anyone can call PUT without persistence checks.

### Data Integrity
9. Sync API for sessions and quotes is a complete stub — data is accepted but never processed.
10. `Genre.book_count` is a denormalized counter that isn't auto-maintained on book create/delete.

---

## 9. TypeScript / Build / Runtime Issues

| Issue | Location | Severity |
|-------|----------|----------|
| Duplicate `storageService` import | `web/src/store/libraryStore.ts:5-6` | Build error |
| `storageService.add()` doesn't exist | `web/src/pages/BookPage/index.tsx:60` | Runtime error |
| Inconsistent API URL defaults | `authStore.ts:23` (api.syverro.com) vs `shared/api/client.ts:6` (localhost:8000) | Auth goes to prod, other calls to local |
| React version mismatch | Web: React 18.2, Mobile/Root: React 19.x | Potential peer dep issues |
| Expo SDK mismatch | Root: SDK 57, Mobile: SDK 54 | Incompatible |
| Zustand version mismatch | Web: v4, Mobile: v5 | API differences |
| Python version mismatch | `runtime.txt`: 3.11, `Dockerfile`: 3.12 | Deployment inconsistency |
| No `name`/`version`/`scripts` in root `package.json` | Root | npm scripts won't work |
| Root `App.tsx` imports from `./mobile-app/src/` | Stale path, directory doesn't exist | Mobile entry point broken |

---

## 10. Configuration Files

### `.env` / `.env.example`
```
DATABASE_URL=postgresql+asyncpg://syverro:syverro@localhost:5432/syverro
POSTGRES_USER=syverro
POSTGRES_PASSWORD=syverro
POSTGRES_DB=syverro
SECRET_KEY=your-secret-key-change-this-in-production
```

### `docker-compose.yml`
- **postgres**: PostgreSQL 15, port 5432, healthcheck, persistent volume
- **backend**: FastAPI via Dockerfile, port 8000, healthcheck at `/health`, depends on postgres

### `web/vite.config.ts`
- Path alias `@` → `./src`
- Dev proxy `/api` → `https://api.syverro.com`

### `web/vercel.json`
- SPA rewrite: all paths → `index.html`
- API proxy: `/api|auth|books|sync|health|...` → `https://api.syverro.com`

### Backend deployment
- **Railway**: Nixpacks, healthcheck at `/docs`
- **Procfile**: `web: uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}`
- **runtime.txt**: `python-3.11` (conflicts with Dockerfile's 3.12)

### CORS (`backend/app/main.py:18-31`)
```
origins: localhost:3000, 3001, 5173, syverro.com, api.syverro.com, 77.233.220.197:3002
```

---

## 11. Blockers for Further Development

| # | Blocker | Impact |
|---|---------|--------|
| 1 | **Missing routes in App.tsx** — BookPage, MyLibraryPage, admin sub-pages | Core features unreachable |
| 2 | **Duplicate import in libraryStore.ts** — TS compilation fails | Build broken |
| 3 | **Hardcoded SECRET_KEY** — bypasses .env config | Security risk, auth tokens use wrong signing key |
| 4 | **Hardcoded CURRENT_USER_ID** — all web users share one profile | Library data not per-user |
| 5 | **No Alembic migrations** — schema managed by `create_all()` | Cannot alter existing tables in production |
| 6 | **Inconsistent API URLs** — authStore uses prod, apiClient defaults to localhost | Mixed environment calls |
| 7 | **Admin settings in-memory** — lost on restart | Settings don't persist |
| 8 | **No test suite** — zero test files in web, mobile, or backend | No regression protection |
| 9 | **Sync engine is mocked** on mobile and incomplete on backend | Mobile sync is non-functional |
| 10 | **Stale root App.tsx** — imports from non-existent `mobile-app/` path | Mobile entry point broken |

---

## Stale / Junk Files

- `backend_new.zip` — stale backup archive (listed in `.gitignore` but committed)
- `backend/backend_all.txt` — code dump file
- `-files findstr__pycache__` — malformed/junk filename in repo root
- `Basic formatting.md` — documentation file
