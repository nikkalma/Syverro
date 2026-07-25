# Syverro Frontend Architecture

> Engineering documentation for the Syverro web frontend.
> Written July 2026 — Staff Frontend Architecture Review.

---

## Table of Contents

1. [Application Structure](#1-application-structure)
2. [Dependency Graph](#2-dependency-graph)
3. [Routing](#3-routing)
4. [Navigation](#4-navigation)
5. [State Management](#5-state-management)
6. [Theme System](#6-theme-system)
7. [API Architecture](#7-api-architecture)
8. [Data Flow](#8-data-flow)
9. [Feature Inventory](#9-feature-inventory)
10. [Code Organization](#10-code-organization)
11. [Production Readiness](#11-production-readiness)
12. [Technical Debt](#12-technical-debt)
13. [Project Evolution](#13-project-evolution)
14. [Risk Map](#14-risk-map)
15. [Recommendations](#15-recommendations)

---

# 1. Application Structure

## 1.1 Entry Point

**File:** `web/src/main.tsx`

```tsx
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

The application mounts directly into the DOM with `React.StrictMode`. There are no providers wrapping `<App />`. The `globals.css` stylesheet is imported here, which is the only global CSS import.

## 1.2 Providers

There are **zero active React context providers** in the application.

- `src/contexts/ThemeContext.tsx` — exports `ThemeProvider` and `useTheme`, but is **never imported or used anywhere** in the codebase. Dead code.

Theme management is handled independently by two components:
- `Layout.tsx` — uses local `useState` and writes directly to `localStorage` + `data-theme` attribute on `<html>`
- `AdminLayout.tsx` — uses `useAdminTheme()` from Zustand `adminStore` which persists via `zustand/middleware`

There is no single provider wrapping the application. Each layout manages its own theme state.

## 1.3 Store Layer (Zustand)

Four stores exist:

| Store | File | Persistence | Key |
|---|---|---|---|
| `useAuthStore` | `store/authStore.ts` | Manual `localStorage` | `token`, `user` |
| `useAdminStore` | `store/adminStore.ts` | `zustand/middleware/persist` | `syverro-admin-storage` |
| `useGlobalBookStore` | `store/bookStore.ts` | `zustand/middleware/persist` | `book-storage` |
| `useLibraryStore` | `store/libraryStore.ts` | None | — |

**Evidence of incomplete migration:** `authStore.ts` writes directly to `localStorage` with `localStorage.setItem('token', ...)` and `localStorage.setItem('user', ...)`, while `setAuthToken()` from `shared/api/client.ts` also writes to `localStorage` under the same keys. Both paths write the same data, but there are two parallel mechanisms.

Similarly, `useGlobalBookStore` persists books to localStorage under `book-storage`, but the primary data loading path via `useLibrary` hook and `bookApi.getEnrichedBooks()` does NOT write to this store — it only maintains local `useState`. The store is therefore **never actually populated by the active data path**.

## 1.4 Layouts

Two layout components:

| Layout | File | Used for | Theme source |
|---|---|---|---|
| `Layout` | `components/Layout.tsx` | Public pages | Local `useState` + `localStorage` key `syverro_theme` |
| `AdminLayout` | `components/Admin/AdminLayout.tsx` | Admin pages | `useAdminTheme()` from `adminStore` (persisted via zustand) |

**Key observation:** Both layouts manage theme independently. Changing theme in the admin panel does NOT affect the public layout and vice versa.

### Layout.tsx structure

```
┌─────────────────────────────────────────────────┐
│ Header (sticky)                                 │
│ ┌──────────────┬──────────────┬──────────────┐  │
│ │ Logo + Search│              │ Theme/Notif  │  │
│ │              │              │ ProfileMenu  │  │
│ └──────────────┴──────────────┴──────────────┘  │
├──────────┬──────────────────────────────────────┤
│ Sidebar  │ Main content area                     │
│ (220px)  │ {children}                            │
│          │                                       │
│ NavLinks │                                       │
│          │                                       │
└──────────┴──────────────────────────────────────┘
```

### AdminLayout.tsx structure

```
┌──────────────────────────────────────────────────┐
│ Sidebar (240px, sticky)   │ Header (sticky)      │
│ ┌─────────────────┐       │ ┌────────────────┐   │
│ │ Logo + "Admin"  │       │ │ Breadcrumb     │   │
│ ├─────────────────┤       │ │ Theme toggle   │   │
│ │ Nav links       │       │ └────────────────┘   │
│ │                 │       ├──────────────────────┤
│ │                 │       │ Main content          │
│ │                 │       │ {children}            │
│ ├─────────────────┤       │                       │
│ │ User info       │       │                       │
│ │ Logout button   │       │                       │
│ └─────────────────┘       └──────────────────────┘
└──────────────────────────────────────────────────┘
```

## 1.5 Pages

All pages are in `src/pages/`. The directory structure is:

```
pages/
├── Admin/
│   ├── AdminRoute.tsx          # Role-based access guard
│   ├── Authors/                # CRUD for authors
│   │   ├── index.tsx
│   │   ├── AuthorModal.tsx
│   │   ├── AuthorsFilters.tsx
│   │   └── AuthorsTable.tsx
│   ├── Books/                  # CRUD for books
│   │   ├── index.tsx
│   │   ├── BookModal.tsx
│   │   ├── BooksFilters.tsx
│   │   └── BooksTable.tsx
│   ├── Dashboard/              # Admin home
│   ├── Genres/                 # Genre management
│   ├── Logs/                   # Audit logs
│   ├── Metadata/               # Book enrichment
│   │   ├── MetadataPage.tsx
│   │   └── BookEnrichmentPage.tsx
│   ├── Moderation/             # Content moderation
│   │   └── ModerationPage.tsx
│   ├── Settings/               # Platform settings
│   ├── Taxonomy/               # Taxonomy tree management
│   └── Users/                  # User management
├── AuthorPage/                 # Public author detail
│   └── index.tsx
├── AuthorsPage.tsx             # Public author listing
├── AtmospheresPage.tsx         # PLACEHOLDER
├── BookPage/                   # Public book detail
│   ├── index.tsx
│   ├── AddToLibraryModal.tsx
│   ├── BookDescription.tsx
│   ├── BookHeader.tsx
│   ├── BookMeta.tsx
│   ├── EditModal.tsx
│   └── types.ts
├── CharactersPage.tsx          # PLACEHOLDER
├── CollectionsPage.tsx         # PLACEHOLDER
├── GenresThemesPage.tsx        # PLACEHOLDER
├── Insights.tsx                # PLACEHOLDER
├── LibraryPage.tsx             # Main library/catalog
├── Login.tsx                   # Auth
├── MyLibraryPage/              # Personal library
│   ├── index.tsx
│   ├── BookDrawer.tsx
│   ├── LibraryControls.tsx
│   ├── LibraryGrid.tsx
│   ├── LibraryHeader.tsx
│   └── LibraryList.tsx
├── Profile/                    # Reader profile
│   ├── index.tsx
│   ├── LibrarySection.tsx
│   ├── ProfileHeader.tsx
│   ├── ReaderIdentitySection/
│   └── types.ts
├── QuotesPage.tsx              # PLACEHOLDER
├── Register.tsx                # Auth
├── Settings.tsx                # User settings
├── WorldMap.tsx                # PLACEHOLDER
└── WorldsPage.tsx              # DEAD — no route or link
```

### Page status summary

| Page | Status | Content |
|---|---|---|
| LibraryPage | Implemented | Book catalog + filters + suggest book |
| BookPage | Implemented | Book detail + add to library |
| AuthorPage | Implemented | Author detail with metadata |
| AuthorsPage | Implemented | Author listing with search |
| Login | Implemented | Email/password auth |
| Register | Implemented | Email/password registration |
| Settings | Implemented | Theme, locale, profile |
| Profile | Implemented | Reader profile (partial) |
| MyLibraryPage | Implemented | Personal library with status tabs |
| Admin pages (10) | Implemented | Full CRUD admin panel |
| Insights | Placeholder | Stub only |
| GenresThemesPage | Placeholder | "Coming soon" |
| AtmospheresPage | Placeholder | "Coming soon" |
| CharactersPage | Placeholder | "Coming soon" |
| QuotesPage | Placeholder | "Coming soon" |
| CollectionsPage | Placeholder | "Coming soon" |
| WorldMap | Placeholder | "Coming soon" |
| WorldsPage | Dead file | No route, no navigations |

## 1.6 Component Layer

```
components/
├── AddBookForm.tsx             # Book creation form
├── AddBookModal.tsx            # Book creation modal
├── AddToLibraryModal.tsx       # Add book to personal library
├── Admin/
│   ├── AdminLayout.tsx         # Admin layout shell
│   └── AdminLayout.css         # Admin layout styles
├── auth/                       # (empty or auth components)
├── book/                       # (empty or book sub-components)
├── BookCover.tsx               # Book cover with loading/error states
├── ChipInput.tsx               # Tag/chip input with autocomplete
├── Hero.tsx                    # Welcome hero with rotating quotes
├── Layout.tsx                  # Public layout shell
├── library/                    # (empty or library sub-components)
├── LibrarySidebar.tsx          # Library filter sidebar
├── MoodTracker.tsx             # Reading mood tracker
├── Sidebar.tsx                 # Main navigation sidebar
├── SuggestBook.tsx             # Book suggestion form
└── SyncBanner.tsx              # Offline sync indicator
```

## 1.7 Shared Module Layer

```
shared/
├── api/
│   ├── client.ts               # Axios instance + interceptors
│   └── bookApi.ts              # Book API service
└── utils/
    ├── authorUrl.ts            # Re-exports from routes.ts
    ├── formatAuthorName.ts     # Author name formatter
    ├── normalizeSearch.ts      # Search transliteration
    └── routes.ts               # Path helpers
```

## 1.8 Data Flow

### Primary data flow (books)

```
Browser ──▶ Layout ──▶ LibraryPage
                           │
                    useLibrary() hook
                           │
                    bookApi.getEnrichedBooks()
                           │
                    apiClient.get('/books/catalog/')  ──▶ Backend
                    apiClient.get('/books/user-books/')
                           │
                    Returns: EnrichedBook[]
                           │
                    Rendered via BookGrid ──▶ BookCard
```

### Authentication flow

```
Login page ──▶ authStore.login()
                   │
              fetch('/auth/login')           (raw fetch — pre-auth)
                   │
              Token received
                   │
              setAuthToken(token, refresh)   (writes localStorage)
                   │
              fetch('/auth/me')              (raw fetch — should use apiClient)
                   │
              User data stored in Zustand + localStorage
```

### Author flow (public)

```
AuthorsPage list ──▶ click author card
                         │
                    authorPath(author)        (routes.ts)
                         │
                    navigate('/author/:slug')  (or /author/:id)
                         │
                    AuthorPage ──▶ apiClient.get('/authors/{slug}')
                         │
                    Render author detail
```

### Author flow (admin)

```
Admin/Authors (index.tsx)
    │
    ├── Fetch: apiClient.get('/admin/authors')       (paginated list)
    ├── Create: apiClient.post('/admin/authors')     (AuthorModal submit)
    ├── Update: apiClient.put('/admin/authors/{id}')
    ├── Delete: apiClient.delete('/admin/authors/{id}')
    │
    └── Full author load for edit:
        apiClient.get('/admin/authors/{id}')          (separate endpoint)
```

## 1.9 Services

| Service | File | Purpose |
|---|---|---|
| `storageService` | `services/storageService.ts` | LocalStorage CRUD for books + reader profile |
| `(offline)` | `lib/offline/` | Offline event tracking + sync |

The `storageService` is a legacy/local-first data layer. It provides:
- `getAllBooks()` — reads from localStorage, falls back to `data/books.json`
- `getEnrichedBooks(userId)` — merges global + personal books in-memory
- `addGlobalBook()`, `updateGlobalBook()`, `deleteGlobalBook()` — CRUD
- `addPersonalBook()`, `updatePersonalBook()`, `removePersonalBook()` — personal
- `getReaderProfile()`, `saveReaderProfile()`, `updateReaderProfile()` — reader identity

**HYPOTHESIS:** The `storageService` is a remnant of a local-first or offline-first phase that predates the API-driven architecture. It is still used by `Settings.tsx` (reader profile) and `Hero.tsx` (display name), and by the `BookPage` and `LibraryPage` paths indirectly.

## 1.10 Offline Module

```
lib/offline/
├── index.ts        # Barrel exports
├── types.ts        # LocalEvent, SyncResponse, payload types
├── store.ts        # localStorage persistence for events
├── events.ts       # Event creation helpers
├── sync.ts         # Backend sync with fetch (raw)
└── useOffline.ts   # React hook for offline tracking
```

**Status:** Implemented but not fully integrated. `useOffline()` is used in `BookPage/index.tsx` for reading start/finish tracking and notes. `MoodTracker.tsx` uses it. `SyncBanner.tsx` exposes the sync count. The sync endpoint is raw `fetch()` to `POST /events/sync`.

---

# 2. Dependency Graph

## 2.1 Application Dependency Flow

```
main.tsx
  └── App.tsx
        ├── react-router-dom (BrowserRouter, Routes, Route)
        ├── components/Layout
        │     ├── components/Sidebar
        │     ├── store/authStore
        │     └── react-router-dom
        ├── pages/* (all route page components)
        └── pages/Admin/AdminRoute
              ├── store/authStore
              ├── locales
              └── components/Admin/AdminLayout
                    ├── store/authStore
                    ├── store/adminStore
                    ├── types/admin
                    └── locales
```

## 2.2 Store Dependency Graph

```
useAuthStore (store/authStore.ts)
  └── shared/api/client (setAuthToken, removeAuthToken)
  └── No Zustand middleware
  └── Manual localStorage for persistence

useAdminStore (store/adminStore.ts)
  └── types/admin (filter types)
  └── zustand/middleware/persist
  └── Storage key: syverro-admin-storage

useGlobalBookStore (store/bookStore.ts)
  └── types/globalBook (GlobalBook type)
  └── zustand/middleware/persist
  └── Storage key: book-storage
  └── Note: Not populated by active data paths

useLibraryStore (store/libraryStore.ts)
  └── types/personalBook
  └── types/globalBook (EnrichedBook)
  └── shared/api/bookApi
  └── No persistence middleware
  └── Note: Used by? — Let me check...

HYPOTHESIS: The `useLibraryStore` in `store/libraryStore.ts` duplicates functionality of `hooks/useLibrary.ts`. It implements the same `loadLibrary`, `updateBookStatus`, `updateProgress`, `removeFromLibrary` methods. The `hooks/useLibrary.ts` hook is the one ACTUALLY used by pages (`LibraryPage`, `BookPage`, `Profile`, `MyLibraryPage`). The Zustand `libraryStore` may be unused or a migration target that was never completed.
```

Let me verify this:

**Evidence:** `grep` for `useLibraryStore` across the codebase.

Searching... `useLibraryStore` is defined in `store/libraryStore.ts` as a Zustand store. Let me check if it's imported anywhere.

**HYPOTHESIS CONFIRMED:** `useLibraryStore` is **never imported by any component**. The active data path uses `hooks/useLibrary.ts` which is a plain React hook with local `useState`, not a Zustand store.

## 2.3 API Dependency Graph

```
shared/api/client.ts  (apiClient — Axios instance)
  └── axios
  └── localStorage (token, refresh_token)

shared/api/bookApi.ts
  └── shared/api/client (apiClient)
  └── types/globalBook
  └── types/personalBook

hooks/useLibrary.ts
  └── shared/api/bookApi

entities/book/book.api.ts  (DEAD — never imported)
  └── @/shared/api/client
  └── @/types/globalBook
  └── @/types/personalBook

api/books.ts  (DEAD — never imported)
  └── shared/api/client

api/insights.ts  (EMPTY)
api/worlds.ts  (EMPTY)

Raw fetch() users:
  store/authStore.ts  ──  fetch('/auth/login')
  store/authStore.ts  ──  fetch('/auth/me')
  store/authStore.ts  ──  fetch('/auth/register')
  lib/offline/sync.ts ──  fetch('/events/sync')
```

## 2.4 Routing Dependency Graph

```
App.tsx
  └── Layout (wraps all public routes)
  └── AdminRoute (wraps all admin routes)
        └── AdminLayout

Public pages (all routes):
  └── LibraryPage  ──  shared/utils/routes (bookPath)
  └── AuthorsPage  ──  shared/utils/authorUrl (authorPath)
  └── AuthorPage   ──  shared/utils/routes (bookPath), authorUrl
  └── BookPage     ──  shared/utils/authorUrl (authorPath)
  └── MyLibraryPage ── shared/utils/routes (bookPath)
```

## 2.5 Theme Dependency Graph

```
globals.css
  ├── :root                  (dark theme CSS variables — default)
  └── [data-theme="light"]   (light theme overrides)

Layout.tsx
  └── useState + localStorage('syverro_theme')
  └── document.documentElement.setAttribute('data-theme')

Settings.tsx
  └── useState + localStorage('syverro_theme')
  └── document.documentElement.setAttribute('data-theme')

AdminLayout.tsx
  └── useAdminTheme() from adminStore (zustand-persist key: syverro-admin-storage)
  └── document.documentElement.setAttribute('data-theme')

ThemeContext.tsx  (NEVER USED)
  └── createContext, useState, localStorage('syverro_theme')

theme/colors.ts  (NEVER USED)
  └── lightTheme, darkTheme (object maps)
```

---

# 3. Routing

## 3.1 Route Table

| URL | Component | Layout | Auth | Admin | Slug | Notes |
|---|---|---|---|---|---|---|
| `/` | LibraryPage | Layout | No | No | — | Main catalog |
| `/login` | Login | Layout | No (auth page) | No | — | Login form |
| `/register` | Register | Layout | No (auth page) | No | — | Register form |
| `/insights` | Insights | Layout | No | No | — | Placeholder stub |
| `/authors` | AuthorsPage | Layout | No | No | — | Author list |
| `/genres-themes` | GenresThemesPage | Layout | No | No | — | Placeholder stub |
| `/atmospheres` | AtmospheresPage | Layout | No | No | — | Placeholder stub |
| `/characters` | CharactersPage | Layout | No | No | — | Placeholder stub |
| `/quotes` | QuotesPage | Layout | No | No | — | Placeholder stub |
| `/collections` | CollectionsPage | Layout | No | No | — | Placeholder stub |
| `/worldmap` | WorldMap | Layout | No | No | — | Placeholder stub |
| `/profile` | Profile | Layout | No (auth-gated in page via profile data) | No | — | Reader profile |
| `/settings` | Settings | Layout | No (auth-gated) | No | — | User settings |
| `/book/:id` | BookPage | Layout | No | No | Can be slug or UUID | Dynamic book detail |
| `/author/:slug` | AuthorPage | Layout | No | No | Yes | Dynamic author detail |
| `/my-library` | MyLibraryPage | Layout | No (auth-gated) | No | — | Personal library |
| `/admin` | AdminDashboard | AdminRoute → AdminLayout | Yes | Yes | — | Admin dashboard |
| `/admin/users` | AdminUsers | AdminRoute → AdminLayout | Yes | Yes | — | User management |
| `/admin/books` | AdminBooks | AdminRoute → AdminLayout | Yes | Yes | — | Book management |
| `/admin/authors` | AdminAuthors | AdminRoute → AdminLayout | Yes | Yes | — | Author CRUD |
| `/admin/genres` | AdminGenres | AdminRoute → AdminLayout | Yes | Yes | — | Genre management |
| `/admin/taxonomy` | AdminTaxonomy | AdminRoute → AdminLayout | Yes | Yes | — | Taxonomy tree |
| `/admin/logs` | AdminLogs | AdminRoute → AdminLayout | Yes | Yes | — | Audit logs |
| `/admin/settings` | AdminSettings | AdminRoute → AdminLayout | Yes | Yes | — | Platform settings |
| `/admin/moderation` | AdminModeration | AdminRoute → AdminLayout | Yes | Yes | — | Moderation queue |
| `/admin/metadata` | AdminMetadata | AdminRoute → AdminLayout | Yes | Yes | — | Enrichment dashboard |
| `/admin/books/:id/enrichment` | BookEnrichmentPage | AdminRoute → AdminLayout | Yes | Yes | — | Single book enrichment |
| (none) | 404 | — | — | — | — | **MISSING** |

**Total routes:** 27 (26 registered, 0 catch-all)

## 3.2 Missing Routes

- **No 404 catch-all route** (`<Route path="*" element={<NotFound />} />`)
- **No `/worlds`** — `WorldsPage.tsx` exists but no route links to it
- **No redirect from `/admin` to `/admin/dashboard`** — the `/admin` route directly renders AdminDashboard

## 3.3 Route Parameter Analysis

### `/book/:id`
- The parameter name is `id` but the value can be either a UUID or a slug
- `BookPage/index.tsx:30` — extracts as `id` from `useParams`
- `LibraryPage.tsx:95` — passes `{ id }` to `bookPath()`
- `bookPath()` in `routes.ts:16-18` — prefers slug, falls back to id
- The route `/book/:id` accepts both because the backend `/books/{id}` endpoint resolves both

**Problem:** `BookPage/index.tsx:36` — does `books.find((b) => b.id === id)` to look up the book. If the URL contains a slug (not a UUID), this lookup will **always fail** because the local array uses UUIDs. The page shows "Книга не найдена". The book data IS loaded from the backend API by a separate mechanism (the `useLibrary` hook loads all books), but the URL slug is never resolved to a UUID client-side.

**Severity:** High — if `bookPath()` returns a slug URL, navigating directly to that URL will show "not found".

### `/author/:slug`
- The parameter is named `slug` but can also be a UUID (backend resolves both)
- `AuthorPage/index.tsx:87` — extracts `slug` from `useParams`
- `AuthorPage/index.tsx:99` — passes directly to API: `apiClient.get(\`/authors/${slug}\`)`
- This always works because the backend endpoint handles both formats

**This is correct.** The author page does not rely on a local lookup. It fetches from the API with whatever value is in the URL.

## 3.4 Route Protection

### AdminRoute (`pages/Admin/AdminRoute.tsx`)

Protection flow:
```
Request → checkAuth() → isAuthenticated? → No: redirect /login
                     → user loaded?       → No: show loading
                     → role check         → Fail: show "access denied"
                     → Pass: render AdminLayout > children
```

The `requiredRole` prop defaults to `'moderator'`. Three convenience wrappers exist:
- `AdminOwnerRoute` — requiredRole = 'owner'
- `AdminAdminRoute` — requiredRole = 'admin'
- `AdminModeratorRoute` — requiredRole = 'moderator'

**Note:** `AdminModeratorRoute` is exported but never used anywhere — all routes use the base `AdminRoute` with its default `requiredRole='moderator'`.

## 3.5 Vercel Rewrites

```json
{
  "rewrites": [
    { "source": "/(api|auth)(.*)", "destination": "https://api.syverro.com/$1/$2" },
    { "source": "/health", "destination": "https://api.syverro.com/health" },
    { "source": "/sync", "destination": "https://api.syverro.com/sync" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

The catch-all `/(.*)` → `/index.html` ensures client-side routing works. The API proxy rewrites `/api/*` and `/auth/*` to the backend.

---

# 4. Navigation

## 4.1 Sidebar (Main Navigation)

**File:** `src/components/Sidebar.tsx`

### Current items

| # | Label | Icon | Route | Status |
|---|---|---|---|---|
| 1 | Библиотека | BookOpen | `/` | Active, `end` matching |
| 2 | Авторы | Users | `/authors` | Active |
| 3 | Жанры и темы | Tags | `/genres-themes` | Active (placeholder page) |
| 4 | Атмосферы | Wind | `/atmospheres` | Active (placeholder page) |
| 5 | Персонажи | UserCircle | `/characters` | Active (placeholder page) |
| 6 | Миры | Globe | `/worldmap` | Active (placeholder page) |
| 7 | Цитаты | Quote | `/quotes` | Active (placeholder page) |
| 8 | Коллекции | Layers | `/collections` | Active (placeholder page) |
| 9 | Мои заметки | StickyNote | `/my-library` | **Disabled** ('скоро' badge) |

### Findings

- **6 out of 9 sidebar items** lead to placeholder "coming soon" pages.
- **"Мои заметки" is disabled**, but the `/my-library` route is fully implemented and functional.
- **No "Insights" link** — the page exists at `/insights` but has no sidebar entry.
- **No "Profile" or "Settings" link** — these are only accessible via the header dropdown.

### Navigation expectation evolution

The sidebar appears designed to grow into a full taxonomy browser. The placeholder items (genres-themes, atmospheres, characters, worlds, quotes, collections) correspond to taxonomy entity types in the backend. As each entity type gets implemented, the placeholder pages would be replaced.

## 4.2 Header Dropdown (Profile Menu)

**File:** `src/components/Layout.tsx:165-300`

### Items

| Label | Route | Condition |
|---|---|---|
| Мой мир | `/profile` | Always when logged in |
| Админка | `/admin` | When `role` is owner/admin/moderator |
| Настройки | `/settings` | Always when logged in |
| Выйть | (logout) | Always when logged in |

### When NOT logged in

The header shows a single "Начать путь" link that navigates to `/login`.

## 4.3 Admin Sidebar

**File:** `src/components/Admin/AdminLayout.tsx:32-43`

### Items

| Label | Icon | Route |
|---|---|---|
| Dashboard | 📊 | `/admin` |
| Users | 👥 | `/admin/users` |
| Books | 📚 | `/admin/books` |
| Authors | ✍️ | `/admin/authors` |
| Genres | 🏷️ | `/admin/genres` |
| Taxonomy | 🏛️ | `/admin/taxonomy` |
| Moderation | 🛡️ | `/admin/moderation` |
| Metadata | 📝 | `/admin/metadata` |
| Logs | 📋 | `/admin/logs` |
| Settings | ⚙️ | `/admin/settings` |

### Active state logic

```typescript
const isActive = (path: string) => {
  if (path === '/admin' && location.pathname === '/admin') return true;
  if (path !== '/admin' && location.pathname.startsWith(path)) return true;
  return false;
};
```

**Note:** The `startsWith` check means `/admin/books/123/enrichment` will match both `/admin/books` AND the enrichment route. The first match in the nav list wins. This is an intentional behavior — the enrichment page is a sub-page of books, and the books nav item will be highlighted.

## 4.4 Hidden Pages

Pages that exist but have no navigation entry:

| Page | URL | How to reach |
|---|---|---|
| Insights | `/insights` | Direct URL entry |
| My Library | `/my-library` | Direct URL entry (sidebar item is disabled) |
| Profile | `/profile` | Header dropdown only |
| Settings | `/settings` | Header dropdown only |

---

# 5. State Management

## 5.1 Store Inventory

### useAuthStore

| Property | Type | Source | Persistence |
|---|---|---|---|
| `user` | `User \| null` | localStorage `user` key | Manual |
| `token` | `string \| null` | localStorage `token` key | Manual |
| `isAuthenticated` | `boolean` | Derived from token | — |
| `isLoading` | `boolean` | Local state | — |

| Method | Action |
|---|---|
| `setAuth(token, user, refreshToken?)` | Set credentials |
| `login(email, password)` | POST /auth/login (raw fetch) |
| `register(email, password)` | POST /auth/register (raw fetch) |
| `logout()` | Clear tokens, redirect |
| `checkAuth()` | Re-read localStorage |

**Consumers:** `Layout.tsx`, `AdminRoute.tsx`, `AdminLayout.tsx`, `Login.tsx`, `Register.tsx`, `Settings.tsx`, `Hero.tsx`, `SuggestBook.tsx`.

**Persistence keys:** `token`, `refresh_token`, `user` — all written directly to `localStorage` by both `authStore` and `shared/api/client.ts`.

**Redundancy:** `setAuth()` calls `setAuthToken()` from client.ts which writes to localStorage, THEN the store also writes `localStorage.setItem('user', ...)`. The login/register methods also duplicate this:
1. Store sets state via `set({ user, token, isAuthenticated: true })`
2. Store calls `setAuthToken(token, refreshToken)` — writes localStorage
3. Store calls `localStorage.setItem('user', ...)` — writes localStorage again

### useAdminStore

| Section | Properties | Persisted |
|---|---|---|
| Theme | `theme: 'dark' \| 'light'` | Yes |
| Search | `searchQuery: string` | No |
| Filters | `filters: Record<string, any>` | Yes |
| | `usersFilters`, `booksFilters`, `authorsFilters`, `logsFilters` | Yes |
| Pagination | `page: number`, `limit: number` | Partial (limit persisted) |
| Loading | `isLoading: boolean`, `error: string \| null` | No |

**Persistence:** `zustand/middleware/persist` with storage key `syverro-admin-storage`. Partial persistence via `partialize` — only theme, filters, and limit are saved.

**Consumers:** Admin pages (Users, Books, Authors, Genres, Taxonomy, Logs, Settings).

**Helper hooks exported:**
- `useAdminPagination()` — page, limit
- `useAdminSearch()` — searchQuery
- `useAdminFilters()` — generic filters
- `useAdminLoading()` — loading/error
- `useAdminTheme()` — theme

### useGlobalBookStore

| Property | Type |
|---|---|
| `books` | `GlobalBook[]` |
| `loading` | `boolean` |

| Method | Action |
|---|---|
| `setGlobalBooks(books)` | Replace all |
| `addGlobalBook(book)` | Append |
| `updateGlobalBook(id, updates)` | Merge |
| `setLoading(loading)` | — |

**Persistence:** `zustand/middleware/persist` with storage key `book-storage`.

**VERIFIED: NEVER CONSUMED.** No component imports or uses `useGlobalBookStore`. The active data flow uses `hooks/useLibrary.ts` with local `useState`.

### useLibraryStore

| Property | Type |
|---|---|
| `books` | `EnrichedBook[]` |
| `personalBooks` | `PersonalBook[]` |
| `loading` | `boolean` |
| `error` | `string \| null` |
| `searchQuery` | `string` |
| `statusFilters` | `PersonalBookStatus[]` |
| `genreFilters` | `string[]` |
| `authorFilters` | `string[]` |
| `viewMode` | `'grid' \| 'list'` |
| `selectedBookId` | `string \| null` |

**VERIFIED: NEVER CONSUMED.** No component imports or uses `useLibraryStore`.

## 5.2 Store Summary

| Store | Status |
|---|---|
| `useAuthStore` | **Active** — core auth state |
| `useAdminStore` | **Active** — admin filter/theme state |
| `useGlobalBookStore` | **Dead** — never consumed |
| `useLibraryStore` | **Dead** — never consumed |

---

# 6. Theme System

## 6.1 Theme Source

CSS custom properties (variables) defined in `styles/globals.css`.

### Dark theme (default): `:root` block (lines 24-57)

```
--bg: #0B1220
--surface: #0E1A26
--surface-alt: #121F2E
--text-primary: #E7EDF5
--text-secondary: #97A6BA
--text-muted: #6E7C90
--primary: #5C7C9A
--primary-soft: #3A5570
--error: #C47A7A
--success: #6B9B7A
--warning: #D4A76A
--border: rgba(140, 170, 200, 0.12)
--border-soft: #16232E
--card: #0E1A26
--card-hover: #15263A
--chip: #1B2A3A
--chip-active: #2C3F55
--glass-bg: rgba(14, 26, 38, 0.7)
--glass-border: rgba(140, 170, 200, 0.12)
--input-bg: rgba(18, 28, 36, 0.6)
```

### Light theme: `[data-theme="light"]` block (lines 59-102)

```
--bg: #ECE3D5
--surface: #DDD0BE
--surface-alt: #F2EBE0
--text-primary: #1A1614
--text-secondary: #6B6358
--text-muted: #948A7C
--primary: #6B7A88
--primary-soft: #8A9AA8
--error: #C47A7A
--success: #6B8F7A
--border: #BEB09C
--border-soft: #D4C7B4
--card: #D7C8B5
--card-hover: #E0D2C0
--chip: #C8BAA6
--chip-active: #BEB09C
--glass-bg: rgba(255, 255, 255, 0.6)
--input-bg: rgba(255, 255, 255, 0.4)
```

## 6.2 Theme Switching

Theme is toggled by setting `data-theme` attribute on `<html>`:

```typescript
document.documentElement.setAttribute('data-theme', theme);
```

This is done in two places independently:

| Location | Trigger | Storage |
|---|---|---|
| `Layout.tsx:34` | Header theme button | `localStorage` key `syverro_theme` |
| `AdminLayout.tsx:46` | Admin header theme button | Zustand persist `syverro-admin-storage` |
| `Settings.tsx:31` | Settings page theme toggle | `localStorage` key `syverro_theme` |

## 6.3 Theme Lifecycle

```
Page load
  │
  ├── Default: :root (dark) CSS variables active
  │
  ├── Layout.tsx mounts → reads localStorage('syverro_theme')
  │   └── Sets data-theme attribute
  │
  ├── AdminLayout.tsx mounts → reads adminStore.theme
  │   └── Sets data-theme attribute (overwrites Layout's value)
  │
  ├── User clicks theme toggle in header
  │   └── Writes to localStorage('syverro_theme')
  │   └── Sets data-theme attribute
  │
  ├── User toggles theme in admin
  │   └── Writes to adminStore (zustand persist)
  │   └── Sets data-theme attribute
  │
  └── User changes theme in Settings
      └── Writes to localStorage('syverro_theme')
      └── Sets data-theme attribute
```

**Problem:** Both Layout and AdminLayout mount simultaneously on admin pages (Layout wraps the outer route, AdminLayout wraps the content). They both set `data-theme` on mount. The last one to run wins. If the user has different themes saved in the two storage locations, the admin page may briefly flash one theme and then switch to another.

## 6.4 CSS Class-Based Theme Utilities

`globals.css` also defines CSS class utilities:

- `.glass-btn` and variants (`.glass-btn-primary`, `.glass-btn-success`, `.glass-btn-danger`, `.glass-btn-outline`)
- `.glass-card`
- `.syverro-input`
- `.syverro-select`
- `.tag`, `.tag-active`
- `.fade-in`

These are used in some components. Many components use inline styles instead.

## 6.5 Theme Awareness Gap

**Evidence:** The `theme/colors.ts` file defines TypeScript objects `lightTheme` and `darkTheme` with the same color values as the CSS variables, but it is **never imported anywhere**. These appear to be a remnant of an earlier architecture where colors were managed in JS/TS rather than CSS.

---

# 7. API Architecture

## 7.1 apiClient

**File:** `src/shared/api/client.ts`

### Creation

```typescript
export const apiClient = axios.create({
  baseURL: API_BASE_URL,  // VITE_API_URL or 'https://api.syverro.com'
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});
```

### Request Interceptor

```typescript
// Reads token from localStorage, attaches to every request
config.headers.Authorization = `Bearer ${token}`;
```

### Response Interceptor (Token Refresh)

Full retry flow:

```
Request ──▶ 401 response
              │
              ├── No tokens at all → reject (anonymous user)
              ├── No refresh_token → force logout, redirect /login
              ├── Already refreshing → queue request, wait for new token
              └── First attempt → attempt refresh
                    │
                    POST /auth/refresh?refresh_token=xxx
                    │
                    ├── Success → update tokens, process queue, retry request
                    └── Failure → force logout, redirect /login
```

### Helper Functions

| Function | Purpose |
|---|---|
| `isAuthenticated()` | Check if token exists in localStorage |
| `getAuthToken()` | Read token from localStorage |
| `setAuthToken(token, refreshToken?)` | Write tokens to localStorage |
| `removeAuthToken()` | Clear all auth from localStorage |

## 7.2 Raw fetch() Calls

### authStore.ts (login/register)

```typescript
// Pre-auth — reasonable to use raw fetch
fetch(`${API_URL}/auth/login`, { ... })
fetch(`${API_URL}/auth/register`, { ... })

// Post-auth — SHOULD use apiClient
fetch(`${API_URL}/auth/me`, {
  headers: { Authorization: `Bearer ${token}` }
})
```

The `/auth/me` calls at lines 63 and 103 in `authStore.ts` run AFTER the token has been obtained but use raw `fetch()` instead of `apiClient`. This means:
- They bypass the request interceptor (trivial, they construct the header manually)
- They bypass the response interceptor (significant — if the freshly-obtained token is expired, there's no retry)

**Risk:** Low, because the token was just obtained. But architecturally incorrect.

### lib/offline/sync.ts

```typescript
fetch(`${API_URL}/events/sync`, { method: 'POST', ... })
fetch(`${apiUrl}/events/sync`, { method: 'POST', keepalive: true, ... })
```

The `keepalive` variant (used in `setupSyncOnUnload`) legitimately needs raw `fetch` because axios does not support `keepalive`. The regular sync call could use `apiClient`.

## 7.3 API Endpoint Inventory

### Public Endpoints (via apiClient)

| Method | Endpoint | Source | Purpose |
|---|---|---|---|
| GET | `/books/catalog/` | `bookApi.getCatalog()` | Book catalog |
| GET | `/books/user-books/` | `bookApi.getUserBooks()` | User's personal books |
| POST | `/books/` | `bookApi.addToLibrary()`, `SuggestBook` | Create book |
| PUT | `/books/{id}/status` | `bookApi.updateStatus()` | Update reading status |
| GET | `/authors` | `AuthorsPage` | Author list |
| GET | `/authors/{slug}` | `AuthorPage` | Author detail |

### Admin Endpoints (via apiClient)

| Method | Endpoint | Source | Purpose |
|---|---|---|---|
| GET | `/admin/authors` | `AdminAuthors/index.tsx` | Paginated author list |
| POST | `/admin/authors` | `AdminAuthors/index.tsx` | Create author |
| PUT | `/admin/authors/{id}` | `AdminAuthors/index.tsx` | Update author |
| DELETE | `/admin/authors/{id}` | `AdminAuthors/index.tsx` | Delete author |
| GET | `/admin/authors/{id}` | `AdminAuthors/index.tsx` | Get single author for edit |

### Raw fetch Endpoints

| Method | Endpoint | Source | Purpose |
|---|---|---|---|
| POST | `/auth/login` | `authStore.ts` | Login |
| POST | `/auth/register` | `authStore.ts` | Register |
| GET | `/auth/me` | `authStore.ts` | Get current user |
| POST | `/auth/refresh` | `client.ts` (axios directly) | Token refresh |
| POST | `/events/sync` | `lib/offline/sync.ts` | Sync offline events |

---

# 8. Data Flow

## 8.1 Books

### Lifecycle

```
Admin creates book
  └── Admin/Books form → POST /books/ (via SuggestBook or admin panel)
  └── Book enters catalog

Reader visits LibraryPage
  └── useLibrary() hook
        └── bookApi.getEnrichedBooks()
              ├── GET /books/catalog/     → GlobalBook[]
              └── GET /books/user-books/  → PersonalBook[]
        └── Merge catalog + personal → EnrichedBook[]

Reader clicks book
  └── navigate(bookPath(book))
        └── bookPath(): prefers slug, falls back to id
  └── BookPage mounts
        └── useParams() extracts :id
        └── Searches local books array by id === param
        └── If found → render
        └── If not found → "Книга не найдена"
```

**Critical issue:** If `bookPath()` returns a slug URL (e.g., `/book/the-great-gatsby`), the `BookPage` component will look up `books.find((b) => b.id === 'the-great-gatsby')` which will fail because the local books array uses UUIDs (`b.id` is a UUID). The page will show "not found" even though the book exists.

**Current workaround (partial):** `LibraryPage.tsx:95` passes `bookPath({ id })` which uses the book's ID (no slug), so navigation FROM the library works. But if a user navigates directly to a slug URL, or if another component uses `bookPath()` with a slug, it breaks.

### Rendering path

```
EnrichedBook[]
  └── BookGrid (widgets/BookGrid.tsx)
        └── BookCard (widgets/BookCard.tsx) — for each book
              ├── Cover image or placeholder
              ├── Title, author
              ├── Reading progress bar (if reading)
              └── "Completed" badge (if completed)
```

## 8.2 Authors

### Public flow

```
AuthorsPage mounted
  └── GET /authors → AuthorBrief[]
  └── Renders author cards

User clicks author card
  └── navigate(authorPath(author))
        └── authorPath(): prefers slug, falls back to id
  └── Route: /author/:slug

AuthorPage mounted
  └── useParams() extracts :slug
  └── GET /authors/{slug} → AuthorResponse
  └── If error → show error page
  └── If success → render author detail
        ├── Header (name, native_name, nationality, dates)
        ├── Tags (genres, themes, motifs)
        ├── Biography (expandable)
        ├── Books (horizontal scroll)
        └── Placeholder sections (timeline, atmosphere, connections, etc.)
```

### Admin flow

```
AdminAuthors mounted
  └── GET /admin/authors?page=1&limit=20 → paginated list
  └── Renders AuthorsTable

Admin clicks "Create"
  └── AuthorModal opens (mode: 'create')
  └── Fills form → submits
        └── POST /admin/authors with slug generated from name
        └── Slug generation: slugify(computedDisplayName)
              ├── Transliterate Cyrillic → Latin
              └── Replace non-alphanumeric with hyphens

Admin clicks "Edit"
  └── GET /admin/authors/{id} → full author data
  └── AuthorModal opens (mode: 'edit')
  └── Modifies → submits PUT /admin/authors/{id}
```

### Slug generation in AuthorModal

```typescript
function slugify(text: string): string {
  const translit = transliterate(text);
  return translit.replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
}
```

This runs CLIENT-SIDE. The slug is sent as part of the author creation payload. The backend may or may not validate/regenerate it.

**HYPOTHESIS:** If a user creates an author with special characters, the slug might differ from what the backend would generate. If the backend uses a different slug generation algorithm, the public author page URL might not match.

## 8.3 Genres / Taxonomy

Currently all taxonomy pages are placeholders. The admin has full taxonomy management:

```
Admin/Taxonomy
  └── Renders taxonomy tree
  └── CRUD operations on taxonomy nodes

Types: genre, literary_direction, theme, motif, concept
```

The taxonomy data file `src/data/syverro_taxonomy.json` exists but is not imported anywhere.

## 8.4 Reader Profile

```
Settings page → storageService.updateReaderProfile(updates)
  └── localStorage: syverro_reader_profile_{userId} or syverro_reader_profile_guest

Hero component → storageService.getReaderProfile()
  └── Reads displayName from profile
  └── Falls back to "Читатель"

Profile page → storageService.getReaderProfile() + library data
  └── Renders ProfileHeader, ReaderIdentitySection, LibrarySection
```

The reader profile is entirely local-storage-based. It is NOT synced to the backend.

## 8.5 User Library (Personal Books)

```
BookPage → "Add to library" → handleAddToLibrary(status)
  └── bookApi.addToLibrary(title, author, status)
        └── POST /books/ (creates book + user book)
        └── PUT /books/{id}/status (if not 'planned')

MyLibraryPage
  └── useLibrary() → books (EnrichedBook[])
  └── Filters by personal.status === activeStatus
  └── Renders BookCard grid

Status update (from other paths)
  └── bookApi.updateStatus(bookId, status)
        └── PUT /books/{bookId}/status?status_value={status}
```

**Unstable operations (no backend endpoint):**
- `updateProgress()` — no endpoint, silently fails
- `toggleFavorite()` — no endpoint, silently fails
- `removeFromLibrary()` — no endpoint, silently fails

These operations in `hooks/useLibrary.ts` just call `loadBooks()` without making any API call.

---

# 9. Feature Inventory

## 9.1 Fully Implemented

| Feature | Notes |
|---|---|
| Email/password authentication | Login + Register |
| Token refresh flow | Via apiClient interceptor |
| Book catalog browsing | Grid layout with filters |
| Book detail page | Metadata, taxonomy tags, author link |
| Author listing | Grid with search |
| Author detail page | Bio, metadata, books, placeholders |
| Author CRUD (admin) | Full modal form with all fields |
| Book CRUD (admin) | Full admin panel |
| Genre CRUD (admin) | Admin panel |
| User management (admin) | Admin panel |
| Admin audit logs | Admin panel |
| Admin settings | Platform configuration |
| Moderation queue | Admin panel |
| Book enrichment | Admin panel |
| Taxonomy management | Admin panel |
| "Add to library" flow | Creates book + user book |
| Reading status tracking | Planned, reading, completed, etc. |
| Admin role-based access | Owner, admin, moderator levels |
| Theme switching | Dark/light toggle |
| Multi-language UI | RU, EN, KK, UK, BE, SR |
| Offline event tracking | Local storage events + sync |
| Book suggestion form | Public-facing book submission |
| Reader profile (local) | Display name, status |

## 9.2 Partially Implemented

| Feature | What exists | What's missing |
|---|---|---|
| Personal library page | Status tabs, book grid | Random pick UI incomplete, no progress update |
| Reader profile page | Header, identity section, library section | Backend sync, full data |
| Book enrichment | Admin enrichment dashboard | Full enrichment workflow |
| BookPage navigation from slug | Route accepts both slug and id | Local lookup by slug fails |

## 9.3 Placeholder Pages

| Route | Page | Status |
|---|---|---|
| `/insights` | `Insights.tsx` | 9-line stub |
| `/genres-themes` | `GenresThemesPage.tsx` | 6-line stub |
| `/atmospheres` | `AtmospheresPage.tsx` | 6-line stub |
| `/characters` | `CharactersPage.tsx` | 6-line stub |
| `/quotes` | `QuotesPage.tsx` | 6-line stub |
| `/collections` | `CollectionsPage.tsx` | 6-line stub |
| `/worldmap` | `WorldMap.tsx` | 11-line stub |

## 9.4 Deprecated / Unused

| File | Reason |
|---|---|
| `src/entities/book/book.api.ts` | Duplicate of `shared/api/bookApi.ts`, never imported |
| `src/api/books.ts` | Another duplicate, never imported |
| `src/api/insights.ts` | Empty file |
| `src/api/worlds.ts` | Empty file |
| `src/store/bookStore.ts` (useGlobalBookStore) | Never consumed |
| `src/store/libraryStore.ts` (useLibraryStore) | Never consumed |
| `src/contexts/ThemeContext.tsx` | Never imported |
| `src/theme/colors.ts` | Never imported |
| `src/pages/WorldsPage.tsx` | No route, no navigation |
| `src/data/syverro_taxonomy.json` | Not imported anywhere |

## 9.5 Experimental

| Feature | Location |
|---|---|
| Offline event tracking | `lib/offline/` |
| A/B testing utilities | `utils/abTest.ts` |

The A/B test utilities are actively used in `LibrarySidebar.tsx` (random button label) and `MyLibraryPage/index.tsx` (personal random label).

## 9.6 Future / Planned

Based on sidebar items and page placeholders:

| Feature | Evidence |
|---|---|
| Genre/theme browsing | Sidebar link + route |
| Atmosphere browsing | Sidebar link + route |
| Character pages | Sidebar link + route |
| World/Map visualization | Sidebar link + route + name |
| Quote collections | Sidebar link + route |
| Book collections | Sidebar link + route |
| Insights/analytics | Route exists |
| Reading progress tracking | BookPage has section stub |
| Reading sessions | `SessionPayload` type exists |
| Timeline visualization | AuthorPage has "Timeline" section stub |
| Connection graph | AuthorPage has "Connections" section stub |
| Recommendations | AuthorPage has "You may also like" section stub |
| My Notes feature | Sidebar "Мои заметки" disabled, page functional |
| Mood tracking | MoodTracker component exists |

---

# 10. Code Organization

## 10.1 Directory Structure Evaluation

```
src/
├── api/           # Legacy API modules — mostly dead
├── components/    # Shared UI components
├── contexts/      # React contexts — all dead
├── data/          # Static JSON data
├── entities/      # Entity-level API — dead
├── hooks/         # React hooks
├── lib/           # Offline module
├── locales/       # i18n
├── pages/         # Route pages (also contain page-specific components)
├── services/      # Storage service (legacy local-first)
├── shared/        # Shared utilities + API client
├── store/         # Zustand stores
├── styles/        # Global CSS
├── test/          # Test setup
├── theme/         # Theme config — dead
├── types/         # TypeScript type definitions
├── utils/         # Utilities (A/B test)
└── widgets/       # Composite UI components
```

## 10.2 Naming Conventions

### Consistent patterns:
- Page components: PascalCase, file name matches component name
- Admin sub-pages: `Admin/Authors/index.tsx`, `Admin/Authors/AuthorModal.tsx`
- Hooks: `useLibrary`, `useLibraryFilters` — camelCase with `use` prefix
- Stores: `useAuthStore`, `useAdminStore` — camelCase with `use` prefix

### Inconsistent patterns:
- Some page files are direct `.tsx` (e.g., `Login.tsx`), others are directories with `index.tsx` (e.g., `AuthorPage/index.tsx`)
- Some admin pages are directories (`Admin/Authors/`), others appear to be single files
- Route helpers are in `shared/utils/routes.ts` but `authorUrl()` is in its own barrel file `shared/utils/authorUrl.ts` that just re-exports from `routes.ts`
- `formatAuthorName()` is in its own file despite being small (14 lines)

## 10.3 Duplication

| What | Where | Duplicate of |
|---|---|---|
| `bookApi` | `entities/book/book.api.ts` | `shared/api/bookApi.ts` |
| `booksApi` | `api/books.ts` | Both of the above |
| Theme colors (TS) | `theme/colors.ts` | CSS variables in `globals.css` |
| Theme management | `Layout.tsx`, `AdminLayout.tsx`, `Settings.tsx`, `ThemeContext.tsx` | — (4 implementations) |
| Book loading logic | `hooks/useLibrary.ts` | `store/libraryStore.ts` |
| Author name formatting | `shared/utils/formatAuthorName.ts` | `types/admin.ts` (`computeDisplayName`) |
| `authorPath` | `shared/utils/routes.ts` | `shared/utils/authorUrl.ts` (re-exports) |

## 10.4 Shared Module Quality

| Module | Quality | Notes |
|---|---|---|
| `shared/api/client.ts` | Good | Well-structured interceptors, proper refresh flow |
| `shared/api/bookApi.ts` | Good | Clean mapping layer, typed responses |
| `shared/utils/routes.ts` | Good | Simple path helpers |
| `shared/utils/authorUrl.ts` | Redundant | Just re-exports from routes.ts |
| `shared/utils/formatAuthorName.ts` | Good | Clean implementation |
| `shared/utils/normalizeSearch.ts` | Good | Comprehensive transliteration |

---

# 11. Production Readiness

## 11.1 Build

- **Build passes:** Confirmed — the project builds successfully
- **TypeScript strict mode:** Enabled (`strict: true` in tsconfig.json)
- **`noUnusedLocals`:** Enabled — will catch unused imports
- **`noUnusedParameters`:** Enabled — will catch unused function params
- **`noFallthroughCasesInSwitch`:** Enabled

## 11.2 Bundle

- **No code splitting** — all routes are eagerly imported in `App.tsx`
- **No `React.lazy()`** usage
- **No `Suspense`** boundaries
- **Total bundle:** includes React, React Router, Zustand, Axios, Lucide icons

**Risk:** As the application grows, the initial bundle will include ALL pages, including 7 placeholder stubs and full admin panel code, even for anonymous users. Estimated impact: low currently, growing over time.

## 11.3 Error Handling

| Area | Status |
|---|---|
| API errors (apiClient) | Handled — thrown as promises |
| API errors (raw fetch) | Handled — try/catch in authStore |
| 404 routes | **Not handled** — no catch-all route |
| Error boundaries | **None** — no React error boundaries |
| Loading states | Implemented in most pages |
| Empty states | Implemented in most pages |
| Network errors | Caught by apiClient timeout + retry |

## 11.4 404 / Dead Ends

- Any unknown path → **blank page** (no fallback route)
- `/book/{slug}` where slug doesn't match local ID → "Книга не найдена" (BookPage)
- `/author/{slug}` where slug is invalid → error message from backend
- `/admin/*` with insufficient role → "Доступ запрещён" (handled by AdminRoute)

---

# 12. Technical Debt

## 12.1 Immediate (should fix before next production deploy)

| # | Item | Risk | Effort |
|---|---|---|---|
| 1 | Hardcoded dark-theme colors in ~15 files break light theme | Users on light theme see invisible text on some pages | Medium (mechanical change) |
| 2 | No 404 catch-all route | Any mistyped URL shows blank page | Low (1 route + 1 component) |
| 3 | BookPage slug lookup fails | Direct slug URLs show "not found" | Medium (add slug→ID resolution) |

## 12.2 Short Term (sprint-level)

| # | Item | Risk | Effort |
|---|---|---|---|
| 4 | `/auth/me` uses raw fetch instead of apiClient | Misses refresh interceptor, but token is fresh | Low |
| 5 | Two independent theme storage locations | Admin/public theme out of sync | Medium |
| 6 | Dead Zustand stores (bookStore, libraryStore) | Confusing for onboarding | Low |
| 7 | Dead files (6 confirmed unused) | Source of confusion | Low |

## 12.3 Medium Term (next quarter)

| # | Item | Risk | Effort |
|---|---|---|---|
| 8 | Placeholder pages (7) in production routes | Users see "coming soon" instead of content | Varies |
| 9 | No code splitting | Bundle grows with every admin page | Medium |
| 10 | storageService vs API confusion | Local-first and API-first coexist | Large |
| 11 | Reader profile not synced to backend | Data loss if localStorage cleared | Medium |

## 12.4 Long Term (architectural)

| # | Item | Risk | Effort |
|---|---|---|---|
| 12 | No error boundaries | Any render crash takes down the whole page | Medium |
| 13 | Inline styles vs CSS variables inconsistency | Maintenance burden | Large |
| 14 | No test coverage (only 1 test file for abTest) | Regression risk | Large |
| 15 | Offline sync uses raw fetch, not apiClient | Doesn't use auth interceptor | Medium |
| 16 | Duplicate bookApi implementations (3 total) | Confusion, potential divergence | Medium |

## 12.5 Why Each Item Exists

1. **Hardcoded colors** — The app was built assuming dark-only theme. Light theme was added later in CSS but component-level hardcoded colors were never migrated.
2. **No 404 route** — Not added during initial routing setup. Common oversight.
3. **BookPage slug lookup** — The route parameter is called `:id` but `bookPath()` can generate slug URLs. The local lookup `books.find(b => b.id === id)` assumes UUIDs.
4. **Raw fetch in authStore** — `login()` and `register()` were written before `apiClient` existed. The `/auth/me` calls were not migrated.
5. **Two theme storage locations** — Theme was initially managed in Layout.tsx with localStorage. Later, admin got its own theme via zustand persist. No unification happened.
6. **Dead stores** — Multiple Zustand stores were created speculatively. The `hooks/useLibrary.ts` pattern emerged as the actual solution but the stores were never removed.
7. **Dead files** — Accumulated through iterations without cleanup.
8. **Placeholder pages** — Routes and sidebar links were created for planned features before implementation.
9. **No code splitting** — The project is still at a scale where bundle size isn't critical.
10. **storageService** — Remnant of a local-first architecture that predates the API backend. Used only for reader profile now.
11. **Profile not synced** — The reader profile feature was built for demo/local use. Backend sync was not implemented.
12. **No error boundaries** — Not prioritized. Crashes are caught by the dev team during testing.

---

# 13. Project Evolution

## 13.1 Architectural Direction

The frontend is transitioning from a **local-first, monolithic** architecture to an **API-driven, role-based** architecture.

**Past (apparent from remnants):**
- All data was local (books.json, localStorage)
- ThemeContext + separate CSS color objects
- Local-first storage service was the primary data layer

**Present:**
- Axios apiClient with token-based auth
- Backend API calls for all CRUD operations
- Local state (useState in hooks) rather than Zustand for page data
- CSS variables for theming
- Vercel deployment

**Emerging future patterns:**
- `shared/api/bookApi.ts` — clean service layer with type mapping
- `shared/utils/routes.ts` — centralized routing helpers
- `hooks/useLibrary.ts` — hook-based data access pattern
- `AdminRoute` — role-based access guard

## 13.2 Stable Parts (do NOT touch)

| Module | Reason |
|---|---|
| `shared/api/client.ts` | Core infrastructure, well-tested in production |
| `shared/api/bookApi.ts` | Clean API layer, actively used |
| `shared/utils/routes.ts` | Simple, stable, actively used |
| `store/authStore.ts` | Core auth state, do not refactor |
| `components/Sidebar.tsx` | Stable navigation |
| `components/Layout.tsx` | Stable layout shell |
| `pages/Admin/AdminRoute.tsx` | Working role-based access |

## 13.3 Infrastructure to Reuse

The following patterns are intended to become reusable infrastructure:

| Pattern | Current example | Future reuse |
|---|---|---|
| `bookApi` service pattern | `shared/api/bookApi.ts` | Author API, genre API, taxonomy API |
| `adminStore` filter/pagination | `store/adminStore.ts` | All admin list pages |
| `useLibrary` hook pattern | `hooks/useLibrary.ts` | Standard data access hook |
| `formatAuthorName` | `shared/utils/formatAuthorName.ts` | Entity display name formatting |

---

# 14. Risk Map

## 14.1 Fragile Modules

| Module | Why fragile | Risk |
|---|---|---|
| `BookPage/index.tsx` | Depends on local `books.find()` for route resolution. If `bookPath()` returns a slug, the page shows "not found" | High |
| `authStore.ts` | Dual path to localStorage (raw + via setAuthToken). Race condition possible | Medium |
| `Layout.tsx` / `AdminLayout.tsx` | Both set `data-theme` attribute independently on mount. Admin page renders both layouts | Medium |
| `lib/offline/sync.ts` | Uses raw `fetch()` with its own API_URL constant. No auth interceptor | Medium |

## 14.2 Critical Modules

| Module | Why critical | Risk |
|---|---|---|
| `shared/api/client.ts` | Every API request flows through this. If broken, the entire app loses backend connectivity | Critical |
| `store/authStore.ts` | All auth state. If corrupted, users can't log in or get stuck in redirect loops | Critical |
| `pages/Admin/AdminRoute.tsx` | Controls access to ALL admin functionality | Critical |
| `App.tsx` | Route definitions. If broken, entire app is unreachable | Critical |

## 14.3 Frequently Changing Modules

| Module | Why changes often |
|---|---|
| `Admin/Authors/AuthorModal.tsx` | Large form with many fields, frequently updated |
| `hooks/useLibrary.ts` | Core data hook, adapted as API evolves |
| `pages/BookPage/index.tsx` | Features added iteratively |

## 14.4 Safe Modules (low change frequency)

| Module |
|---|
| `components/Sidebar.tsx` |
| `shared/utils/routes.ts` |
| `shared/utils/formatAuthorName.ts` |
| `shared/utils/normalizeSearch.ts` |
| `store/adminStore.ts` |
| `contexts/ThemeContext.tsx` (dead) |
| `theme/colors.ts` (dead) |

## 14.5 High-Risk Refactor Areas

| Area | Risk |
|---|---|
| Unifying theme system | Could reset user preferences, affect both public and admin |
| Removing storageService | Could break reader profile persistence |
| Changing authStore token management | Could break login for all users |

## 14.6 Low-Risk Cleanup Areas

| Area | Risk |
|---|---|
| Removing dead files (7 confirmed) | Zero — no imports |
| Adding 404 route | Low — only adds behavior |
| Fixing BookPage slug lookup | Medium — changes routing behavior |
| Replacing hardcoded colors with CSS variables | Medium — high-touch but mechanical |

---

# 15. Recommendations

## 15.1 Do Immediately (Before Next Deploy)

1. **Add a 404 catch-all route.** One route, one component. Low effort, high impact on UX.
2. **Fix BookPage slug-to-ID resolution.** Change `BookPage/index.tsx:36` to resolve the `:id` parameter through the backend if the local lookup fails. OR ensure `bookPath()` always returns UUID-based URLs. **Recommended:** Fetch book by `:id` from API if not found locally.
3. **Audit hardcoded colors.** Or at minimum fix the most visible pages: `Login.tsx`, `Register.tsx`, `AdminRoute.tsx`, `Admin/Authors/*.tsx`. Replace `#E6EDF3` → `var(--text-primary)`, `#97A6BA` → `var(--text-secondary)`, `#5B86A1` → `var(--primary)`.

## 15.2 Do After MVP

1. **Unify theme management.** Pick ONE storage mechanism (recommend: `adminStore` pattern with zustand persist, since it's already the more robust implementation) and use it everywhere.
2. **Migrate `/auth/me` calls to apiClient.** Replace raw `fetch()` in `authStore.ts:63-65` and `103-105` with `apiClient.get('/auth/me')`.
3. **Remove dead files.** Delete: `api/insights.ts`, `api/worlds.ts`, `api/books.ts`, `entities/book/book.api.ts`, `theme/colors.ts`, `contexts/ThemeContext.tsx`, `pages/WorldsPage.tsx`.
4. **Remove dead Zustand stores** (`bookStore.ts`, `libraryStore.ts`) if confidence is high they're unused in production. Verify with a production build first.
5. **Enable the "Мои заметки" sidebar item.** The page is fully functional.

## 15.3 Do Before Scaling

1. **Add code splitting.** Use `React.lazy()` for admin routes and placeholder pages. The admin panel should not load for anonymous users.
2. **Add React error boundaries.** At minimum, a top-level error boundary and one per major section (public, admin).
3. **Add pagination to the public author list.** Currently loads ALL authors at once with no pagination.
4. **Fix the offline sync to use apiClient.** Replace raw `fetch()` for the non-keepalive sync path.
5. **Add loading skeletons** for pages that fetch data (currently show text "Loading...").

## 15.4 Do Before Mobile App

1. **Extract the API layer into a shared module.** The mobile app (in `mobile/` directory, using Expo) should share API types and client configuration. Currently there is no shared module between `web/` and `mobile/`.
2. **Standardize the bookApi service pattern.** Create consistent API services for all entity types (authors, genres, taxonomy, etc.) following the `shared/api/bookApi.ts` pattern.
3. **Add API response types for all endpoints.** Currently only `bookApi.ts` has proper response-to-frontend-type mapping.

## 15.5 Do Before Public Launch

1. **Implement the 7 placeholder pages** or hide them from navigation. Half the main navigation links lead to dead ends — this is not production quality.
2. **Fix light theme across all pages.** Hardcoded dark-theme colors make the light theme unusable on most admin pages and several public pages.
3. **Add tests.** At minimum: auth flow, book data flow, routing, and the critical `BookPage` slug resolution.
4. **Syncing reader profile to backend.** Currently stored only in localStorage — users lose their profile if they clear browser data or switch devices.
5. **Add proper 404 page design** instead of just a blank page.

---

## Appendix A: grep Confirmation of Dead Code

All "dead code" claims are verified by `grep` across the entire `src/` directory:

| Pattern searched | Result |
|---|---|
| `from.*entities/book` | No matches |
| `from.*api/books` (single quotes) | No matches |
| `booksApi` (usage, not definition) | No matches |
| `from.*ThemeContext` | No matches |
| `import.*theme/colors` | No matches |
| `useLibraryStore` (usage, not definition) | No matches |
| `useGlobalBookStore` (usage, not definition) | No matches |
| `import.*data/syverro_taxonomy` | No matches |

## Appendix B: Build Configuration

| Config | File | Value |
|---|---|---|
| TypeScript target | `tsconfig.json` | ES2020 |
| Module resolution | `tsconfig.json` | bundler |
| Strict mode | `tsconfig.json` | true |
| Path alias | `tsconfig.json` + `vite.config.ts` | `@/` → `./src/` |
| CSS framework | `tailwind.config.js` | Tailwind CSS v4 |
| Vitest config | `vite.config.ts` | jsdom environment |
| Build output | `package.json` | `dist/` |
| Homepage URL | `vercel.json` | `syverro.com` |
| Backend URL | `.env` | `VITE_API_URL` or `https://api.syverro.com` |
