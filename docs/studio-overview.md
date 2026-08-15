# Syverro Studio — Editorial Workspace

## What is Studio

Studio is the editorial and administrative workspace of Syverro. It provides
curators, moderators, and administrators with tools to manage the library's
content: authors, books, genres, taxonomy, moderation queues, metadata
enrichment, user management, and system settings.

Studio is **not** a separate application — it is a set of routes and components
within the same React frontend, mounted under `/studio/*` and protected by
role-based access. Legacy `/admin/*` URLs redirect to their `/studio/*`
counterparts.

## Deployment task

- Move Studio from `/studio/*` to `studio.syverro.com`, preserving role-based
  access and a direct navigation link back to `syverro.com`. Treat DNS,
  routing, authentication-cookie scope, and legacy `/studio/*` redirects as
  explicit acceptance criteria.

## Reader vs. Studio

| Area | Reader | Studio |
|------|--------|--------|
| Audience | All visitors | Curators, moderators, admins, owner |
| Purpose | Browse, read, discover | Edit, curate, moderate, configure |
| Routes | `/`, `/book/:id`, `/author/:slug`, etc. | `/studio/*` |
| Auth required | No | Yes |
| Layout | Public `Layout` with sidebar | `StudioLayout` with sidebar + `StudioHeader` |
| Theme | Dark only | Dark/Light toggle |

## Workspaces

A **workspace** is a dedicated section of Studio for managing a single entity
type or concern. Each workspace is a route group with its own layout, editor
views, and tooling.

### Current workspaces

| Workspace | Route | Description |
|-----------|-------|-------------|
| Home | `/studio` | Entry point with stats, recently edited, entity launch cards |
| Users | `/studio/users` | User list, filters, create/edit modal |
| Books | `/studio/books` | Book list, filters, create/edit modal |
| Authors | `/studio/authors` | Author list, create/edit, **AuthorEditor** (multi-section entity editor) |
| Genres | `/studio/genres` | Genre tree, filters, create/edit modal |
| Taxonomy | `/studio/taxonomy` | Taxonomy tree management |
| Moderation | `/studio/moderation` | Moderation queue for pending content |
| Metadata | `/studio/metadata` | Book enrichment and metadata workspace |
| Activity Log | `/studio/logs` | System activity log viewer |
| Settings | `/studio/settings` | System configuration |

### Future entity editors

The AuthorEditor pattern (multi-section editor with sidebar navigation) is
designed to be reused for other entities:

- **BookEditor** — manage book details, editions, covers, translations, awards
- **GenreEditor** — manage genre metadata, parent/child relations, descriptions
- **UserEditor** — manage user profiles, roles, activity history

Each entity editor should:

1. Create a context provider under `pages/Studio/<Entity>/<Entity>Editor/`
2. Define sections in a config array (label + path + component)
3. Reuse shared components from `components/Studio/shared/`:
   - `EntityEditorHeader` — avatar, name, completeness, status
   - `EditorSectionNav` — tab navigation between sections
   - `EditorSectionCard` — reusable card wrapper
   - `EmptyWorkspace` — placeholder for future sections
   - `StudioHeader` — persistent header with search and module name

## Component architecture

```
components/Studio/
  StudioLayout.tsx         — root layout: sidebar + content area
  StudioLayout.css
  shared/
    StudioHeader.tsx        — persistent top bar: title, search, theme toggle
    EntityEditorHeader.tsx  — entity editor identity bar
    EditorSectionNav.tsx    — section tab navigation
    EditorSectionCard.tsx   — reusable card with title and actions
    EmptyWorkspace.tsx      — placeholder state for empty sections
    StatCard.tsx            — stats display card
```

## How to add a new module

1. Create a page directory under `pages/Studio/<Module>/`
2. Add routes in `App.tsx` under the `/studio` route group
3. Add a nav entry in `StudioLayout.tsx` `getNavItems()`
4. Add locale keys under `admin.nav` in `locales/en.ts` and `locales/ru.ts`
5. Add a module card entry in `DashboardModuleCards.tsx`
6. Reuse shared Studio components where applicable
