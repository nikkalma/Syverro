# ADMIN_PANEL_STATUS.md

> Detailed analysis of the Syverro admin panel — 2026-07-19

---

## 1. How the Admin Panel Currently Works

### Architecture
The admin panel is a React SPA inside `web/src/pages/Admin/`, wrapped by `AdminRoute` (role guard) and `AdminLayout` (sidebar + header). It communicates with the FastAPI backend at `/admin/*` endpoints using both the shared Axios `apiClient` and raw `fetch()`.

### Entry Point
```
App.tsx:38-45
  /admin → <AdminRoute> → <AdminDashboard>
```

**Only the Dashboard route is registered.** The sidebar in `AdminLayout.tsx:21-29` links to 7 sub-paths (`/admin/users`, `/admin/books`, etc.) but none have `<Route>` definitions in `App.tsx`. Clicking any sidebar link renders the Layout shell with no content — effectively a blank page inside the admin chrome.

### Auth Guard (`AdminRoute.tsx:1-117`)
1. Calls `checkAuth()` on mount to hydrate from localStorage
2. If `!isAuthenticated` → redirect to `/login`
3. If `!user` → loading spinner
4. Compares user role level against required level (default: `moderator`)
5. If insufficient → "Access denied" page
6. If passed → wraps children in `<AdminLayout>`

Role hierarchy (`AdminRoute.tsx:46-55`):
```
owner = 4 > admin = 3 > moderator = 2 > user = 1
```

### Layout (`AdminLayout.tsx:1-267`)
- Left sidebar (240px, sticky, full viewport height)
- 7 nav items: Dashboard, Users, Books, Authors, Genres, Logs, Settings
- Bottom section: user avatar, email, role badge, logout
- Main content area with sticky header + theme toggle
- Mobile: off-screen sidebar with hamburger toggle

### State Management (`adminStore.ts:1-547`)
Zustand store with `persist` (localStorage key: `syverro-admin-storage`):
- `theme`, `searchQuery`, `filters` (generic), section-specific filters (`usersFilters`, `booksFilters`, etc.)
- `page`, `limit`, `isLoading`, `error`
- Only `useAdminTheme` hook is actively used by AdminLayout

---

## 2. Endpoints Used by the Admin Panel

### Dashboard (`Dashboard/index.tsx`)
| Method | Endpoint | Used For | Status |
|--------|----------|----------|--------|
| GET | `/admin/stats` | Stat cards | Working |
| GET | `/admin/users/recent` | Recent users table | Working |
| GET | `/admin/logs/recent` | Recent activity table | **Stub — returns []** |

### Users (`Users/index.tsx`, `Users/UserModal.tsx`)
| Method | Endpoint | Used For | Status |
|--------|----------|----------|--------|
| GET | `/admin/users` | User list | Working |
| PUT | `/admin/users/{id}` | Edit user | **Broken** |
| PUT | `/admin/users/{id}/role` | Change role | Working |
| PUT | `/admin/users/{id}/block` | Block/unblock | Working |
| DELETE | `/admin/users/{id}` | Delete user | Working |
| POST | `/admin/users/{id}/logout` | Force logout | **Stub — no-op** |

### Books (`Books/index.tsx`)
| Method | Endpoint | Used For | Status |
|--------|----------|----------|--------|
| GET | `/admin/books` | Book list | Working |
| POST | `/admin/books` | Create book | Working |
| PUT | `/admin/books/{id}` | Edit book | Working |
| PUT | `/admin/books/{id}/publish` | Toggle publish | Working |
| DELETE | `/admin/books/{id}` | Delete book | Working |

### Authors (`Authors/index.tsx`)
| Method | Endpoint | Used For | Status |
|--------|----------|----------|--------|
| GET | `/admin/authors` | Author list | Working |
| POST | `/admin/authors` | Create author | Working |
| PUT | `/admin/authors/{id}` | Edit author | Working |
| DELETE | `/admin/authors/{id}` | Delete author | Working |

### Genres (`Genres/index.tsx`)
| Method | Endpoint | Used For | Status |
|--------|----------|----------|--------|
| GET | `/admin/genres` | Genre list | Working |
| POST | `/admin/genres` | Create genre | Working |
| PUT | `/admin/genres/{id}` | Edit genre | Working |
| DELETE | `/admin/genres/{id}` | Delete genre | Working |

### Logs (`Logs/index.tsx`)
| Method | Endpoint | Used For | Status |
|--------|----------|----------|--------|
| GET | `/admin/logs` | Log list | **Stub — returns []** |

### Settings (`Settings/index.tsx`)
| Method | Endpoint | Used For | Status |
|--------|----------|----------|--------|
| GET | `/admin/settings` | Load settings | Working (in-memory) |
| PUT | `/admin/settings` | Save settings | Working (in-memory) |

### Moderation (`Moderation/Suggestions.tsx`)
| Method | Endpoint | Used For | Status |
|--------|----------|----------|--------|
| — | — | **No API calls** | localStorage only |

---

## 3. Pages: Fully Working vs Broken

### Fully Working (renderable + functional after route is added)

| Page | Files | Notes |
|------|-------|-------|
| **Dashboard** | `Dashboard/index.tsx`, `StatCard.tsx`, `RecentUsers.tsx`, `RecentActivity.tsx` | Stats and recent users load. Activity section empty due to backend stub. `Dashboard.css` is never imported. |
| **Books** | `Books/index.tsx`, `BooksTable.tsx`, `BooksFilters.tsx`, `BookModal.tsx` | Full CRUD, search, filter, create/edit modal. All functional. |
| **Authors** | `Authors/index.tsx`, `AuthorsTable.tsx`, `AuthorsFilters.tsx`, `AuthorModal.tsx` | Full CRUD, search, filter, create/edit modal. All functional. |
| **Genres** | `Genres/index.tsx`, `GenresTable.tsx`, `GenresFilters.tsx`, `GenreModal.tsx` | Full CRUD, search, create/edit modal. All functional. |

### Partially Broken

| Page | Files | What's Broken |
|------|-------|---------------|
| **Users** | `Users/index.tsx`, `UsersTable.tsx`, `UsersFilters.tsx`, `UserModal.tsx` | Edit modal sends `first_name`/`last_name`/`username` but backend only accepts `phone` (admin.py:287). Backend always returns `null` for those fields (admin.py:209-212). Force logout is a no-op. |
| **Settings** | `Settings/index.tsx` | All settings stored in-memory on backend (admin.py:889) — lost on every server restart. No database persistence. |
| **Logs** | `Logs/index.tsx`, `LogsTable.tsx`, `LogsFilters.tsx` | Backend logs endpoint returns empty array (admin.py:854-874). No Log model exists. Page renders but always shows "No data". |

### Non-Functional / Placeholder

| Page | Files | What's Broken |
|------|-------|---------------|
| **Moderation** | `Moderation/Suggestions.tsx` | Entirely localStorage-based. No backend API. No nav item in sidebar. Not routed. No `index.tsx` wrapper. |

### Unreachable (not routed)

**Every page except Dashboard is unreachable.** The following routes are missing from `App.tsx`:

```tsx
// These routes do NOT exist in App.tsx:
/admin/users    → Users page
/admin/books    → Books page
/admin/authors  → Authors page
/admin/genres   → Genres page
/admin/logs     → Logs page
/admin/settings → Settings page
/admin/moderation → Moderation page
```

The sidebar links navigate to these paths, but React Router finds no matching `<Route>` and renders nothing inside the `<AdminLayout>` shell.

---

## 4. Missing Permissions / Authorization Issues

| Issue | Location | Description |
|-------|----------|-------------|
| No permission checks on admin pages | All admin `index.tsx` files | Pages rely solely on `AdminRoute` at the route level. Individual buttons (delete, edit, role change) are **not gated** by `canManageUsers()`, `canDeleteUsers()`, etc. A moderator can see and click all buttons. |
| `canViewLogs()` unused | `types/admin.ts:335` | Defined but never imported by any component. |
| `AdminOwnerRoute` / `AdminAdminRoute` / `AdminModeratorRoute` unused | `AdminRoute.tsx:107-117` | Exported but never imported anywhere. Could be used for per-page role gates. |
| Moderator can do everything admin can | `backend/admin.py:92-100` | `check_admin()` allows owner + admin + moderator. No separate moderator restrictions exist. |
| Frontend role checks are cosmetic | `AdminLayout.tsx:38-39` | Checks `ADMIN_ROLES.includes()` but only hides the entire layout, not individual actions. |
| User edit modal shows fields backend ignores | `UserModal.tsx:35-42` | Sends `first_name`, `last_name`, `username` — backend `PUT /admin/users/{id}` only accepts `phone`. Form fields appear to save but data is silently dropped. |

---

## 5. Missing Backend Functionality

| Feature | Endpoint | Status | What's Needed |
|---------|----------|--------|---------------|
| **User profile fields** | PUT `/admin/users/{id}` | Broken | Backend only updates `phone`. Need to add `first_name`, `last_name`, `username` support to both the User model and the endpoint. |
| **User response fields** | GET `/admin/users` | Broken | Always returns `first_name: null, last_name: null, username: null`. These fields don't exist in the User model. |
| **Force logout** | POST `/admin/users/{id}/logout` | Stub | `admin.py:360-368` — TODO: implement session clearing. Needs a token blacklist or session store. |
| **Activity logs** | GET `/admin/logs` | Stub | `admin.py:854-874` — TODO: implement Log model. Need a `Log` model, middleware to record actions, and populate the endpoint. |
| **Recent logs** | GET `/admin/logs/recent` | Stub | Same as above — returns empty. |
| **Settings persistence** | GET/PUT `/admin/settings` | In-memory | `admin.py:889` — `settings_store = SettingsResponse()`. Need a `Settings` model or key-value store in the database. |
| **Book suggestion moderation** | — | Missing | Moderation page uses localStorage. Need a `BookSuggestion` model and CRUD endpoints. |
| **Session/quote sync** | POST `/sync/push` | Stub | `sync.py:461-470` — `process_session_change` and `process_quote_change` always return "applied" without processing. |
| **Genre book count** | — | Manual | `Genre.book_count` is denormalized and not auto-maintained on book create/delete. |
| **User avatar** | — | Missing | AdminLayout shows an avatar circle but there's no avatar field in the User model or upload endpoint. |

---

## 6. TypeScript Issues

| Issue | File:Line | Severity | Description |
|-------|-----------|----------|-------------|
| Untyped `useState([])` | `Dashboard/index.tsx:15-16` | Low | `recentUsers` and `recentLogs` are `never[]`. Should be `AdminUser[]` and `AdminLog[]`. |
| `onSave` typed as `(data: any)` | `Books/BookModal.tsx:11` | Low | No type safety on book create/update callback. |
| `AdminGenre` missing `description` | `types/admin.ts:151-158` | Medium | Backend returns `description` in genre responses but the TypeScript type doesn't include it. |
| `AdminBookCreate` missing `is_published` | `types/admin.ts:97-104` | Low | BookModal sends `is_published` on create but `AdminBookCreate` type doesn't define it. Works at runtime because fetch sends raw object. |
| Mixed API clients | Multiple files | Medium | Users page uses `apiClient` (Axios), Books/Authors/Genres/Logs/Settings use raw `fetch()`, UserModal uses raw `fetch()` while its parent uses `apiClient`. |
| Generic `filters` cross-contamination | `adminStore.ts:239-246` | Medium | `setBooksFilters` also sets the generic `filters` field. Switching between admin sections can leave stale filter state. |
| Store helpers mostly unused | `adminStore.ts:422-546` | Low | `useAdminPagination`, `useAdminSearch`, `useAdminFilters`, `useAdminLoading` are exported but never imported. Only `useAdminTheme` is used. |
| `filters` typed as `Record<string, any>` | `adminStore.ts:17` | Low | No type safety on filter shape — any key/value accepted. |
| Duplicate `AdminUserResponse` schema | `schemas/admin.py:16` vs `api/admin.py:31` | Low | Backend defines the response schema twice with slightly different fields. |
| `LogsFilters` duplicates log types | `Logs/LogsFilters.tsx:19-26` | Low | 21 log type options hardcoded inline instead of importing `LOG_TYPE_LABELS` from `types/admin.ts`. |

---

## 7. Recommended Fix Order

### Phase 1 — Make It Runnable (critical blockers)

| # | Fix | Files | Why First |
|---|-----|-------|-----------|
| 1 | **Add missing routes to App.tsx** | `web/src/App.tsx` | Without this, only the Dashboard renders. 6 pages are completely unreachable. Add routes for `/admin/users`, `/admin/books`, `/admin/authors`, `/admin/genres`, `/admin/logs`, `/admin/settings`. |
| 2 | **Fix duplicate import in libraryStore** | `web/src/store/libraryStore.ts:5-6` | Duplicate `import { storageService }` breaks TypeScript compilation. Remove the duplicate line. |

### Phase 2 — Fix Broken Backend Endpoints

| # | Fix | Files | Why |
|---|-----|-------|-----|
| 3 | **Add `first_name`, `last_name`, `username` to User model** | `backend/app/models/user.py`, `backend/app/api/admin.py` | User edit form sends these fields but backend ignores them. Add columns to model, update `AdminUserUpdate` schema, update PUT endpoint. |
| 4 | **Fix admin settings persistence** | `backend/app/api/admin.py`, `backend/app/models/` | Create a `Setting` model (key-value or JSON column). Replace in-memory `settings_store` with DB read/write. Migrate existing settings. |
| 5 | **Implement force logout** | `backend/app/api/admin.py:360-368` | Create a token blacklist table or session store. On "logout", add current token's JTI to the blacklist. Check blacklist in `get_current_user()`. |
| 6 | **Implement Log model + recording** | `backend/app/models/`, `backend/app/api/admin.py` | Create a `Log` model (user_id, action, entity_type, entity_id, details, timestamp). Add logging middleware or decorator for admin write operations. Populate `/admin/logs` and `/admin/logs/recent` endpoints. |

### Phase 3 — Fix TypeScript & Consistency

| # | Fix | Files | Why |
|---|-----|-------|-----|
| 7 | **Unify API client usage** | All admin `index.tsx` files | Migrate all raw `fetch()` calls to use the shared `apiClient` from `shared/api/client.ts`. Eliminates manual token handling and ensures consistent error handling (401 redirect, timeouts). |
| 8 | **Add `description` to `AdminGenre` type** | `web/src/types/admin.ts:151-158` | Type mismatch with backend response. |
| 9 | **Type Dashboard state** | `web/src/pages/Admin/Dashboard/index.tsx:15-16` | Change `useState([])` to `useState<AdminUser[]>([])` and `useState<AdminLog[]>([])`. |
| 10 | **Fix `AdminBookCreate` type** | `web/src/types/admin.ts:97-104` | Add optional `is_published` field. |
| 11 | **Type `onSave` in BookModal** | `web/src/pages/Admin/Books/BookModal.tsx:11` | Replace `any` with `AdminBookCreate` or `AdminBookUpdate`. |

### Phase 4 — Permission Guards & UX

| # | Fix | Files | Why |
|---|-----|-------|-----|
| 12 | **Add per-button permission checks** | All admin pages | Use `canManageUsers()`, `canDeleteUsers()`, `canManageSettings()` etc. from `types/admin.ts` to conditionally render buttons. Currently a moderator sees delete buttons they can't actually use (backend returns 403). |
| 13 | **Fix User edit modal** | `Users/UserModal.tsx` | Remove `first_name`/`last_name`/`username` fields (or add them to backend). Add a `phone` field (the only field backend accepts). |
| 14 | **Import Dashboard.css** | `Dashboard/index.tsx` | Add `import './Dashboard.css'` so the `dashboard-grid` class applies. |
| 15 | **Clean up adminStore** | `store/adminStore.ts` | Remove or consolidate unused helpers (`useAdminPagination`, etc.). Fix `filters` cross-contamination by removing the shared `filters` field. |

### Phase 5 — Missing Features

| # | Fix | Files | Why |
|---|-----|-------|-----|
| 16 | **Implement book suggestion moderation API** | `backend/`, `Moderation/Suggestions.tsx` | Create `BookSuggestion` model + CRUD endpoints. Migrate Suggestions.tsx from localStorage to API calls. Add nav item to AdminLayout sidebar. |
| 17 | **Implement session/quote sync** | `backend/app/api/sync.py:461-470` | Replace stub `process_session_change` and `process_quote_change` with actual DB upsert logic. |
| 18 | **Auto-maintain Genre.book_count** | `backend/app/api/admin.py` | Increment/decrement `Genre.book_count` when books are created/deleted with that genre. |
| 19 | **Implement SECRET_KEY fix** | `backend/app/core/security.py:8` | Import `SECRET_KEY` from `config.py` instead of hardcoding. |

---

## Appendix A: Admin API Endpoint Reference

| # | Method | Path | Auth | Response |
|---|--------|------|------|----------|
| 1 | GET | `/admin/stats` | mod+ | `AdminStatsResponse` |
| 2 | GET | `/admin/users` | mod+ | `{data: AdminUser[], total, page, limit}` |
| 3 | GET | `/admin/users/recent` | mod+ | `AdminUser[]` |
| 4 | GET | `/admin/users/{id}` | mod+ | `AdminUser` |
| 5 | PUT | `/admin/users/{id}` | mod+ | `AdminUser` (phone only) |
| 6 | PUT | `/admin/users/{id}/role` | mod+ | `AdminUser` |
| 7 | PUT | `/admin/users/{id}/block` | mod+ | `AdminUser` |
| 8 | DELETE | `/admin/users/{id}` | owner | `{"ok": true}` |
| 9 | POST | `/admin/users/{id}/logout` | mod+ | `{"ok": true}` (no-op) |
| 10 | GET | `/admin/books` | mod+ | `{data: AdminBook[], total, page, limit}` |
| 11 | GET | `/admin/books/{id}` | mod+ | `AdminBook` |
| 12 | POST | `/admin/books` | mod+ | `AdminBook` |
| 13 | PUT | `/admin/books/{id}` | mod+ | `AdminBook` |
| 14 | PUT | `/admin/books/{id}/publish` | mod+ | `AdminBook` |
| 15 | DELETE | `/admin/books/{id}` | mod+ | `{"ok": true}` |
| 16 | GET | `/admin/authors` | mod+ | `{data: AdminAuthor[], total, page, limit}` |
| 17 | GET | `/admin/authors/{id}` | mod+ | `AdminAuthor` |
| 18 | POST | `/admin/authors` | mod+ | `AdminAuthor` |
| 19 | PUT | `/admin/authors/{id}` | mod+ | `AdminAuthor` |
| 20 | DELETE | `/admin/authors/{id}` | mod+ | `{"ok": true}` |
| 21 | GET | `/admin/genres` | mod+ | `{data: AdminGenre[], total, page, limit}` |
| 22 | GET | `/admin/genres/{id}` | mod+ | `AdminGenre` |
| 23 | POST | `/admin/genres` | mod+ | `AdminGenre` |
| 24 | PUT | `/admin/genres/{id}` | mod+ | `AdminGenre` |
| 25 | DELETE | `/admin/genres/{id}` | mod+ | `{"ok": true}` |
| 26 | GET | `/admin/logs` | mod+ | `{data: [], total: 0, ...}` (stub) |
| 27 | GET | `/admin/logs/recent` | mod+ | `[]` (stub) |
| 28 | GET | `/admin/settings` | owner | `SettingsResponse` (in-memory) |
| 29 | PUT | `/admin/settings` | owner | `SettingsResponse` (in-memory) |

## Appendix B: Admin File Inventory

```
web/src/pages/Admin/
├── AdminRoute.tsx               # 117 lines — role guard
├── Dashboard/
│   ├── index.tsx                # 136 lines — stats + recent tables
│   ├── StatCard.tsx             # 27 lines — stat display card
│   ├── RecentUsers.tsx          # 104 lines — recent users table
│   ├── RecentActivity.tsx       # 70 lines — recent logs table
│   └── Dashboard.css            # Dashboard styles (NOT imported)
├── Users/
│   ├── index.tsx                # 549 lines — user CRUD page
│   ├── UsersTable.tsx           # 354 lines — user data table
│   ├── UsersFilters.tsx         # 189 lines — search + role/status filters
│   └── UserModal.tsx            # 362 lines — view/edit user modal
├── Books/
│   ├── index.tsx                # 306 lines — book CRUD page
│   ├── BooksTable.tsx           # 317 lines — book data table
│   ├── BooksFilters.tsx         # 188 lines — search + genre/status filters
│   └── BookModal.tsx            # 423 lines — create/edit book modal
├── Authors/
│   ├── index.tsx                # 285 lines — author CRUD page
│   ├── AuthorsTable.tsx         # 268 lines — author data table
│   ├── AuthorsFilters.tsx       # 117 lines — search + country filter
│   └── AuthorModal.tsx          # 314 lines — create/edit author modal
├── Genres/
│   ├── index.tsx                # 285 lines — genre CRUD page
│   ├── GenresTable.tsx          # 246 lines — genre data table
│   ├── GenresFilters.tsx        # 88 lines — search filter
│   └── GenreModal.tsx           # 165 lines — create/edit genre modal
├── Logs/
│   ├── index.tsx                # 94 lines — log viewer page
│   ├── LogsTable.tsx            # 244 lines — log data table
│   └── LogsFilters.tsx          # 181 lines — 21 log type filters
├── Settings/
│   └── index.tsx                # 401 lines — system settings form
└── Moderation/
    └── Suggestions.tsx          # 320 lines — book suggestions (localStorage)

web/src/components/Admin/
├── AdminLayout.tsx              # 267 lines — sidebar + header layout
└── AdminLayout.css              # 73 lines — responsive + scrollbar styles

web/src/store/
└── adminStore.ts                # 547 lines — Zustand store + helpers

web/src/types/
└── admin.ts                     # 340 lines — types, constants, permissions
```
