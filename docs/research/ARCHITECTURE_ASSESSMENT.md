# Syverro — Architecture Assessment

## 1. Executive Summary

Syverro is evolving from a single Expo prototype into **three connected products**, each with distinct responsibilities, data ownership, and access boundaries:

| Product | Purpose | Users | Data Owned | Platform |
|---------|---------|-------|------------|----------|
| **Syverro Mobile** | Personal reading instrument | Individual readers | Private reading data (library, sessions, quotes, profile, statistics) | Kotlin + Jetpack Compose (Android) |
| **Syverro Studio** | Internal ecosystem management | Administrators, moderators, editors | Curated catalog, taxonomy, moderation state, operational metrics | Web (framework TBD) |
| **Syverro Website** | Public knowledge platform | General public | No data of its own — reads from Studio catalog + aggregate analytics | Web (framework TBD) |

**Key design constraints that span all three products:**

- Offline-first on Mobile (Room as source of truth, sync is secondary)
- No gamification or social features by design
- Private by default — individual reading data is never exposed externally
- Calm-tech philosophy for Mobile; Studio/Website are productivity/knowledge tools with different UX expectations
- Separate objective (catalog) and subjective (personal reading data) at every layer
- Graph-native thinking — entities are nodes in a network, not rows in a spreadsheet

---

## 2. Identified Problems with Current Documentation

### 2.1 Missing Three-Product Model

`ARCHITECTURE_DIRECTION.md` describes only two products (Mobile + Studio). The Website is not mentioned. This causes:

- **Knowledge graph visualization** is assigned to Studio (section 3.4 of `SYVERRO_STUDIO_REQUIREMENTS.md`), but Studio's graph view should be an internal management/debugging tool, not the public exploration experience.
- **Aggregate analytics** is assigned to Studio (section 3.8), but public-facing reader intelligence and ecosystem insights belong on the Website. Studio should own only operational metrics (system health, moderation workload, catalog coverage).
- **Phase 3** in the Architecture Direction conflates "Studio Expansion" with what should be two separate tracks: Studio (internal) and Website (public).

### 2.2 Missing Backend Product Definition

The current docs mention "server" and "sync engine" but never define a **Backend** as a distinct architectural concern. The backend is implied by Mobile's sync requirements and Studio's web hosting, but its responsibilities are not explicitly documented:

- API contracts between Mobile ↔ Backend, Studio ↔ Backend, Website ↔ Backend
- Authentication and authorization boundaries
- Data separation between curated catalog, personal user data, and analytics aggregates
- Sync protocol design
- Rate limiting, pagination, versioning strategy

### 2.3 Mobile: Unresolved Architectural Decisions

| Issue | Current State | Needs Decision |
|-------|--------------|----------------|
| **Navigation** | 5-tab layout proposed (MOBILE_V1_REQUIREMENTS.md) but UX_PATTERNS.md describes 4 tabs | Which is correct? |
| **Active Book** | Session engine references an "active book" concept, but the Book entity has a status field that already includes "reading" | Is ActiveBook a separate entity or derived from status? |
| **Sync scope** | V1 is offline-first, but do we build the sync infrastructure in V1 or defer to post-MVP? |
| **Auth** | Auth screen described in UX_PATTERNS.md, but V1 may start with no server | Is auth required for V1 or is it a local-only app initially? |

### 2.4 Studio Requirements Overlap with Website

`SYVERRO_STUDIO_REQUIREMENTS.md` sections 3.4 (Knowledge Graph) and 3.8 (Analytics) need to be split:

- **Studio keeps:** Graph editing (internal), moderation workload, system health, catalog coverage metrics
- **Website gets:** Public graph visualization, public analytics, reader intelligence, discovery experience
- **Shared/Backend gets:** API layer, data storage with access boundaries, computed aggregates

### 2.5 Missing Documentation for Website

No Website requirements document exists. The following need to be defined:

- Public knowledge graph interaction model (exploration vs. search vs. browsing)
- Analytics page designs (top books, genre distribution, reading patterns)
- Privacy enforcement mechanisms
- Data freshness guarantees
- SEO and performance requirements
- Technology stack decision (SSR? static generation? SPA?)

---

## 3. Recommended Architecture

### 3.1 Product Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Server)                         │
│  PostgreSQL ─┬─ Catalog API ──┬─ Mobile Sync API            │
│               ├─ Auth API      ├─ Studio Admin API           │
│               └─ Analytics DB  └─ Website Public API         │
│  Access boundaries enforced at API layer                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌───────────────┐ ┌──────────┐ ┌───────────┐
│     Mobile    │ │  Studio  │ │  Website  │
│  (Android)    │ │  (Web)   │ │  (Web)    │
│               │ │          │ │           │
│ Offline-first │ │ Internal │ │ Public    │
│ Room +        │ │ admin    │ │ knowledge │
│ StateFlow     │ │ tool     │ │ platform  │
│               │ │          │ │           │
│ Owns:         │ │ Owns:    │ │ Owns:     │
│ - library     │ │ - catalog│ │ - graph   │
│ - sessions    │ │ - taxonomy│ │  viz      │
│ - quotes      │ │ - modera-│ │ - ecosys- │
│ - profile     │ │  tion    │ │  tem      │
│ - stats       │ │ - graph  │ │  insights │
│               │ │  editing │ │ - discov- │
│               │ │ - ops    │ │  ery      │
│               │ │  metrics │ │           │
└───────────────┘ └──────────┘ └───────────┘
```

### 3.2 Data Flow

```
STUDIO (internal)
  │  Creates/edits catalog: books, authors, genres, atmospheres, series
  ▼
BACKEND
  │  Stores in PostgreSQL (curated catalog schema)
  │  Computes aggregate analytics (privacy-filtered)
  │
  ├──► MOBILE syncs catalog down, pushes personal data up
  │     Mobile never sends personal data to other clients
  │     Backend stores personal data in separate schema (encrypted at rest)
  │
  └──► WEBSITE reads catalog + computed aggregates
        Website never accesses raw personal data
        All analytics are pre-computed, aggregated, anonymized
```

### 3.3 Key Architectural Principles

1. **PostgreSQL as single source of truth for ecosystem data.**
   - Curated catalog (Studio writes, everyone reads)
   - Personal user data (Mobile writes, restricted access)
   - Analytics aggregates (Backend computes, Website reads)

2. **Access boundaries enforced at the API layer, not the database layer.**
   - Mobile API: authenticate user, return user's data + public catalog
   - Studio API: authenticate admin, return all catalog + ops metrics
   - Website API: no auth required, return only public aggregate data

3. **Mobile is offline-first.**
   - Room is source of truth on device
   - Sync is asynchronous, silent, conflict-resolved by timestamp
   - App works fully without internet

4. **Studio and Website are different applications.**
   - Separate codebases, separate deployments, separate UI frameworks
   - Studio is a productivity tool (dense tables, keyboard shortcuts, batch ops)
   - Website is a public experience (beautiful graph viz, accessible analytics)

---

## 4. MVP Boundary

### 4.1 Syverro Mobile V1

**In scope:**
- Personal library (grid, search, filter, sort, add/edit books)
- Book detail view with edit mode
- Reading session lifecycle (start, timer, pause/resume, finish)
- Quote capture during sessions
- Quote browser with search and filters
- Personal statistics (progress ring, genre chart, weekly activity calendar)
- Profile with reading insights
- Settings (theme toggle, language selection, export)
- 5-tab navigation (as per MOBILE_V1_REQUIREMENTS.md)
- Dark/light theme with glass surfaces
- i18n (en, ru, be, ua)
- Local-only operation (no server, no sync)

**Deferred to post-MVP:**
- Server sync (mobile ↔ backend)
- Auth (login/register) — app starts in local-only mode
- Background timer persistence (timer survives app restart)
- ActiveBook concept (if separate from status)
- Biometric unlock
- CSV/JSON import

### 4.2 Syverro Studio V1

**In scope:**
- Book CRUD with all metadata fields
- Author CRUD
- Genre taxonomy management
- Atmosphere taxonomy management
- Series management
- Basic moderation workflow (draft → pending → published)
- User account lookup (reader accounts)
- Internal knowledge graph inspector (read-only or basic editing)
- Internal operational metrics (sync status, catalog completeness, moderation queue)

**Deferred to post-V1:**
- Full knowledge graph editor with visual canvas
- Advanced analytics dashboards
- Bulk import/enrichment pipelines
- API key management for third-party integrations

### 4.3 Syverro Website V1

**In scope:**
- Browseable knowledge graph visualization (read-only)
- Book/author/genre/atmosphere detail pages
- Search across catalog
- Public ecosystem analytics (aggregate only — top books, genre distribution, reading patterns)
- Privacy-safe aggregated reader intelligence

**Deferred to post-V1:**
- Interactive graph exploration (pan/zoom/filter)
- Knowledge discovery features (recommendations, related entities)
- User-contributed content
- Advanced analytics dashboards

---

## 5. Documentation Structure

### 5.1 Keep (already correct)

| Document | Status |
|----------|--------|
| `PRODUCT_DECISIONS.md` | Valid — binding for all products |
| `SESSION_ENGINE.md` | Valid — mobile-specific, well-defined |
| `DESIGN_SYSTEM.md` | Valid — applies to Mobile (Studio/Website may extend) |
| `UX_PATTERNS.md` | Valid — Mobile-specific screen specs |
| `DATABASE_SCHEMA.md` | Valid — Mobile Room schema (server schema is separate) |
| `MIGRATION_CHECKPOINT.md` | Valid — Expo → Mobile migration reference |
| `MIGRATION_NOTES.md` | Valid — clean rewrite policy |

### 5.2 Update

| Document | What to change |
|----------|---------------|
| `ARCHITECTURE_DIRECTION.md` | Add Website as third product. Update Phase 3 to split Studio and Website. Update data flow diagram to three-product model. Add backend as explicit layer. |
| `SYVERRO_STUDIO_REQUIREMENTS.md` | Split sections 3.4 and 3.8 into Studio-internal (graph editor, ops metrics) vs. Website (public viz, public analytics). Add backend API integration section. |

### 5.3 Create

| Document | Purpose |
|----------|---------|
| `SYVERRO_WEBSITE_REQUIREMENTS.md` | Product requirements for the public knowledge platform |
| `BACKEND_ARCHITECTURE.md` | API contracts, data separation strategy, auth model, sync protocol |
| `API_SPECIFICATION.md` | API endpoints for Mobile ↔ Backend, Studio ↔ Backend, Website ↔ Backend |

---

## 6. Open Decisions Requiring Approval

### 6.1 Mobile V1 — Offline-Only vs. Auth + Sync

**Question:** Does Mobile V1 ship as a **local-only app** (no login, no server) or with **auth and sync infrastructure**?

**Trade-offs:**
- Local-only: faster to ship, no backend required at launch, but users lose data on device loss
- With sync: requires backend API, auth system, and sync protocol — adds months to timeline

**Recommendation:** Ship V1 as local-only. Add sync as the first post-MVP milestone. This aligns with the offline-first philosophy and avoids backend dependency during Mobile V1 development.

### 6.2 Mobile Navigation — 4 Tabs vs. 5 Tabs

**Conflict:**
- `MOBILE_V1_REQUIREMENTS.md` describes 5 tabs: Profile, Library, Session, Stats, Settings
- `UX_PATTERNS.md` describes 4 tabs: Profile, Library, Session, Settings (Stats merged into Profile or Library)

**Recommendation:** 4 tabs — merge Statistics into Profile. The profile screen naturally contains stats (progress ring, genre chart, weekly activity) and the "Library → Session" flow is the primary reading path. Stats as a standalone tab competes with Profile.

### 6.3 Database Schema — Studio vs. Mobile

**Question:** Is the current `DATABASE_SCHEMA.md` (Room entities) the same schema mirrored on PostgreSQL, or does PostgreSQL have a different schema optimized for Studio's curated catalog?

**Recommendation:** They are related but different:
- **PostgreSQL (server):** Normalized, with audit logging, moderation state, and full relation tables. Authors are separate records. Genres are hierarchical. Atmospheres are their own table.
- **Room (mobile):** Denormalized for offline queries. Books contain embedded genre names and author names (cached from sync). No moderation state. No audit log.

This needs to be explicitly stated in the schema docs.

### 6.4 ActiveBook Design

**Question:** Is the "active book" concept a dedicated entity (separate table, one active at a time) or derived from the Book status field (the book with `status = "reading"`)?

**Recommendation:** Derived from status. A `status = "reading"` filter on the Book entity is simpler and avoids sync complexity. If the concept needs to persist across app restarts, the Session's `bookId` with `status = "in_progress"` is the source of truth.

### 6.5 Knowledge Graph Editor — Phase

**Question:** Should the knowledge graph editor (visual canvas) be in Studio V1 or deferred?

**Recommendation:** Defer to Studio post-V1. Studio V1 should ship with:
- Entity management forms (books, authors, genres, atmospheres)
- A tabular/list view of relationships (which authors link to which books)
- Graph integrity validation (reports orphans, missing fields)

The visual force-directed graph editor is complex and not needed for initial catalog management.

### 6.6 Website Technology Stack

**Question:** What framework for the Website?

**Options:**
- **Next.js** (React, SSR, good SEO, mature ecosystem)
- **Astro** (content-focused, minimal JS, good for static + dynamic)
- **Remix** (full-stack, nested routes, good DX)
- **SvelteKit** (lightweight, fast, good DX)

**Recommendation:** Next.js. Best ecosystem support for knowledge graph visualization (D3.js, Three.js, vis.js integrations), SSR for SEO, and type sharing if Studio also uses TypeScript. This also gives the option of colocating Studio and Website in a monorepo if desired.

---

## 7. Next Steps

If this assessment is approved:

1. **Update** `ARCHITECTURE_DIRECTION.md` to include the Website as Product 3 and the Backend as an explicit architectural layer
2. **Restructure** `SYVERRO_STUDIO_REQUIREMENTS.md` to split internal graph/analytics from public-facing features
3. **Create** `SYVERRO_WEBSITE_REQUIREMENTS.md` with full product spec
4. **Create** `BACKEND_ARCHITECTURE.md` with API contracts and data separation strategy
5. **Resolve** the open decisions flagged in section 6
6. Begin Mobile V1 implementation in Kotlin + Jetpack Compose