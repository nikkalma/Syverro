# Syverro Studio — Requirements

## 1. Purpose

Syverro Studio is a web-based administration application that powers the Syverro ecosystem. It is the single source of truth for all curated content: books, authors, genres, atmospheres, and their interconnections.

The mobile reader application (Syverro) is a thin client that syncs data from Studio. Users add books to their personal library from the Studio-curated catalog. Studio provides moderation, enrichment, taxonomy management, and analytics that no individual reader needs or should manage themselves.

Studio is not a CMS in the traditional sense — it is a *knowledge curation tool* for a structured bibliographic graph.

---

## 2. User Roles

### 2.1 Administrator

Full system access. Can manage users, roles, system configuration, and all content entities.

**Capabilities:**
- All Editor capabilities
- All Moderator capabilities
- Create, delete, and deactivate user accounts
- Assign and revoke roles
- View system audit logs
- Configure sync schedules and server parameters
- Access raw database and export tools
- Delete content irreversibly

### 2.2 Moderator

Content quality control. Reviews and approves content submitted by editors or imported from external sources.

**Capabilities:**
- Review pending content submissions
- Approve or reject changes to books, authors, genres, atmospheres
- Flag content for administrator review
- Merge duplicate authors, genres, or books
- Lock records to prevent further editing
- View moderation history and change logs
- Cannot delete content permanently (soft-delete only)

### 2.3 Editor

Content creator. Adds and enriches bibliographic data.

**Capabilities:**
- Create and edit books
- Create and edit authors
- Create and edit genres
- Create and edit atmospheres
- Link books to authors, genres, atmospheres, series
- Upload cover images
- Suggest new genres and atmospheres (pending moderator approval)
- Cannot delete content
- Cannot modify user accounts
- Cannot access system configuration

---

## 3. Main Modules

### 3.1 Books

**Purpose:** The central entity. Every book in the Syverro catalog is created, enriched, and maintained here. The mobile app pulls book metadata from this module to populate users' personal libraries.

**Key actions:**
- Create a new book record
- Edit all metadata fields
- Upload and crop cover images
- Link book to one or more authors
- Assign genres (one-to-many)
- Assign atmospheres (one-to-many)
- Assign series membership and position
- Set original publication year, language, country
- Set page count
- Write a curator's summary / description
- Mark book as published, draft, or archived
- Flag a book for moderation review
- View change history
- Merge duplicate book records

**Required information:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Title | String | Yes | Primary title in original language |
| Title (transliterated) | String | No | Latin script rendering |
| Subtitle | String | No | |
| Authors | Relation[] | Yes | One or more linked Author records |
| Original language | String | Yes | ISO 639-1 code |
| Original country | String | No | ISO 3166-1 alpha-2 |
| Original year | Integer | No | |
| Page count | Integer | No | |
| Cover image | Image | No | Upload, 2:3 aspect ratio |
| Description | Text | No | Curator-written summary (not blurb) |
| Genres | Relation[] | No | Linked Genre records |
| Atmospheres | Relation[] | No | Linked Atmosphere records |
| Series | Relation | No | Linked Series record |
| Series position | Integer | No | |
| ISBN (10/13) | String | No | Unique if provided |
| OCLC / WorldCat ID | String | No | |
| Goodreads ID | String | No | For cross-reference |
| Status | Enum | Yes | `draft`, `published`, `archived` |
| Created by | Reference | Auto | Editor who created the record |
| Created at | Timestamp | Auto | |
| Last modified by | Reference | Auto | |
| Last modified at | Timestamp | Auto | |

---

### 3.2 Authors

**Purpose:** Manage author identities. Authors are nodes in the knowledge graph, linked to books, countries, and eras. An author record exists once and is referenced by all their books.

**Key actions:**
- Create a new author record
- Edit name variants
- Link author to country of origin
- Set birth and death years
- Write a biographical summary
- Upload author portrait
- Link author to related authors (influences, collaborations)
- Merge duplicate author records
- View all books by this author
- Flag for moderation

**Required information:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Name | String | Yes | Canonical name |
| Name (native script) | String | No | E.g., Cyrillic, Kanji |
| Pseudonyms | String[] | No | Alternate names |
| Country | String | No | ISO 3166-1 alpha-2 |
| Birth year | Integer | No | |
| Death year | Integer | No | |
| Biography | Text | No | |
| Portrait | Image | No | 1:1 aspect ratio |
| Related authors | Relation[] | No | Influence map |
| Status | Enum | Yes | `draft`, `published`, `archived` |

---

### 3.3 Taxonomy

**Purpose:** Manage the controlled vocabulary for genres. Genres form a hierarchical or flat taxonomy that the mobile app uses for filtering, sorting, and statistics.

**Key actions:**
- Create a new genre
- Edit genre name and description
- Set parent genre (hierarchy support)
- Add genre aliases / alternative names
- Merge duplicate genres
- View books assigned to this genre
- Flag for moderation

**Required information:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Name | String | Yes | Canonical name |
| Description | Text | No | Curator definition |
| Parent genre | Relation | No | Hierarchical parent |
| Aliases | String[] | No | Alternative names |
| Color | String | No | Hex color for UI badges |
| Icon | String | No | Icon identifier |
| Status | Enum | Yes | `draft`, `published`, `archived` |

---

### 3.4 Knowledge Graph

**Purpose:** Visualize and edit the connections between entities. The knowledge graph is the defining feature that distinguishes Syverro from a simple book list. It surfaces relationships: author → books → genres → atmospheres → countries → eras.

**Key actions:**
- View the graph centered on any entity (book, author, genre, atmosphere)
- Pan and zoom the graph canvas
- Expand nodes to reveal connected entities
- Add connections between entities
- Remove connections
- Search for an entity and center the graph on it
- Filter graph by entity type
- Export graph view as image
- Detect orphan entities (connected to nothing)
- Detect potential duplicate entities (suggested by connection patterns)

**Required information:**
- Graph data is derived from entity relations (no standalone graph records)
- Each node is an entity (book, author, genre, atmosphere, series)
- Each edge is a typed relationship (wrote, belongs-to, has-atmosphere, part-of-series, influenced-by)
- UI renders as a force-directed graph with type-based color coding

**Entity types and their connection rules:**

| Source | Relation | Target |
|--------|----------|--------|
| Author | wrote | Book |
| Book | belongs-to | Genre |
| Book | has-atmosphere | Atmosphere |
| Book | part-of | Series |
| Author | influenced-by | Author |
| Author | born-in | Country |
| Book | published-in | Country |
| Genre | parent-of | Genre |

---

### 3.5 Atmospheres

**Purpose:** Manage the atmosphere taxonomy — the emotional and tonal qualities of books. This is separate from genre (which describes what a book *is*) and is unique to Syverro's product vision.

**Key actions:**
- Create a new atmosphere
- Edit name and description
- Set mood attributes (optional: warm/cool, light/dark, intense/calm)
- Merge duplicate atmospheres
- View books assigned to this atmosphere

**Required information:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Name | String | Yes | E.g., "Melancholic", "Cozy", "Tense" |
| Description | Text | No | Definition and examples |
| Mood vector | Float[2..4] | No | Optional dimensional encoding |
| Color | String | No | Hex color for UI representation |
| Status | Enum | Yes | `draft`, `published`, `archived` |

**Expected atmosphere examples:** Cozy, Melancholic, Tense, Dreamlike, Humorous, Somber, Philosophical, Mysterious, Romantic, Bleak, Whimsical, Meditative.

---

### 3.6 Metadata

**Purpose:** Manage enums, constants, and reference data used across the system. This module exists to avoid hardcoding values.

**Key actions:**
- View and edit language list (ISO 639-1 codes with display names)
- View and edit country list (ISO 3166-1 alpha-2 codes with display names)
- View and edit reading format options
- View and edit book status values
- Configure rating scale parameters
- Add or deprecate enum values
- Export metadata schema as JSON

**Required information:**

| Section | Contents |
|---------|----------|
| Languages | Code, display name (native + English), enabled flag |
| Countries | Code, display name, region, enabled flag |
| Reading formats | Key, display name, icon |
| Book statuses | Key, display name, color, sort order |
| Rating scale | Min, max, step |
| Sync configuration | Sync interval, batch size, conflict strategy |

---

### 3.7 Users

**Purpose:** Manage Syverro user accounts. Note that this refers to *reader* accounts (mobile app users), not Studio administrative accounts. Studio admin accounts are managed separately through a different mechanism.

**Key actions:**
- View user list with registration date, last active date, book count
- Search users by email or name
- View a user's public reading statistics (books, sessions, hours)
- Deactivate or ban a user account
- Delete user data (GDPR compliance)
- View sync status per user (last sync, pending changes)
- Export a user's data archive

**Required information:**

| Field | Type | Notes |
|-------|------|-------|
| Email | String | Unique identifier |
| Display name | String | User-set |
| Registration date | Timestamp | Auto |
| Last active | Timestamp | Auto |
| Total books | Integer | Computed |
| Total sessions | Integer | Computed |
| Total reading hours | Float | Computed |
| Account status | Enum | `active`, `deactivated`, `banned` |
| Sync cursor | String | Last sync position |
| Pending changes count | Integer | Unsynchronized local changes |

---

### 3.8 Analytics

**Purpose:** Provide aggregate insights about the Syverro ecosystem. These are not individual user statistics (which are private) — they are anonymous aggregate metrics for the administrator to understand platform health.

**Key actions:**
- View total registered users over time (chart)
- View total books added across all users over time (chart)
- View total reading sessions logged over time (chart)
- View genre popularity ranking (aggregate, anonymized)
- View atmosphere popularity ranking
- View most-added authors
- View most-read books (by session count, anonymized)
- View language distribution
- View active users per day/week/month
- Export analytics as CSV

**Required information (all computed from aggregate data, no individual user data exposed):**

| Metric | Aggregation | Granularity |
|--------|-------------|-------------|
| Registered users | Count | Daily, weekly, monthly |
| Books added | Count | Daily, weekly, monthly |
| Sessions logged | Count | Daily, weekly, monthly |
| Reading hours logged | Sum | Daily, weekly, monthly |
| Genre distribution | Count per genre | All-time |
| Atmosphere distribution | Count per atmosphere | All-time |
| Most-added authors | Top 20 | All-time, monthly |
| Most-read books | Top 20 by session count | All-time, monthly |
| Language distribution | Count per language | All-time |
| Active users | DAU, WAU, MAU | Daily, weekly, monthly |

**Privacy constraint:** No individual user's data may be exposed in Analytics. All metrics must be aggregated over a minimum threshold (e.g., at least 5 users contribute to any displayed data point).

---

## 4. Cross-Cutting Concerns

### 4.1 Moderation Workflow

Content changes flow through a moderation pipeline:

```
DRAFT → PENDING_REVIEW → APPROVED → PUBLISHED
                 ↓
              REJECTED → DRAFT
```

- Editors create content in `draft` or suggest changes to published content → status becomes `pending_review`
- Moderators review and either `approve` (→ `published`) or `reject` (→ `draft` with reason)
- Administrators can bypass moderation and publish directly
- All status transitions are logged with actor, timestamp, and reason

### 4.2 Audit Logging

Every state-changing action across all modules is logged:

| Field | Value |
|-------|-------|
| Timestamp | Auto |
| Actor | User ID + role |
| Action | `create`, `update`, `delete`, `approve`, `reject`, `merge`, `lock` |
| Entity type | `book`, `author`, `genre`, `atmosphere`, `user`, etc. |
| Entity ID | UUID |
| Previous state | JSON snapshot (before) |
| New state | JSON snapshot (after) |
| Reason | Free text (required for rejections and deletions) |

Audit logs are append-only and cannot be deleted or modified by any role.

### 4.3 Sync Integration

Studio is the authoritative source for curated content. The mobile app syncs from Studio on a schedule. The sync contract:

- Books published in Studio are available for mobile users to add to their library
- Books archived in Studio are hidden from new additions but remain in existing users' libraries
- Genre and atmosphere taxonomy updates propagate to all mobile clients on next sync
- Author record updates propagate similarly
- Deletions in Studio are soft — content is marked archived, never hard-deleted

### 4.4 UI Principles

Studio is a management tool, not a consumer application. The UI should prioritize:

- Dense information display (tables, lists, bulk actions)
- Keyboard navigation and shortcuts
- Batch editing capabilities
- Side-by-side diff view for moderation
- Dark theme as default (matching the mobile app's design system)
- Responsive layout (tablet-friendly, not primarily mobile)
- No calm-tech constraints — Studio is a productivity tool, not a reading environment