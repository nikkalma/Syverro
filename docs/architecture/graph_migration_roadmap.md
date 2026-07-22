# Graph Migration Roadmap

> Roadmap for migrating Syverro from a record-based architecture to a graph-first architecture.

---

## Phase 0: Foundation (Completed)

The infrastructure for graph thinking is already in place.

### Existing Infrastructure

- **`KnowledgeNode`** (`models/knowledge_node.py`) — generic entity node with type, slug, hierarchical parent, and metadata JSONB. Covers any entity type that lacks a dedicated model.
- **`KnowledgeRelation`** (`models/knowledge_relation.py`) — typed directed edge between two `KnowledgeNode`s with weight and metadata.
- **`BookKnowledgeRelation`** (`models/book_knowledge_relation.py`) — typed edge connecting a `Book` to a `KnowledgeNode`, with provenance (source), confidence, and moderation status.
- **`book_authors`** — many-to-many junction for `Book ──wrote──→ Author`.
- **`book_genres`** — many-to-many junction for `Book ──belongs_to──→ Genre`.
- **`UserBookExperience`** — subjective graph layer (user connects book to atmosphere/mood nodes).
- **Admin taxonomy endpoints** — CRUD for nodes, relations, and book-knowledge links.
- **Admin book-author endpoints** — dedicated endpoints for managing the `wrote` relationship.

---

## Phase 1: Complete Entity Inventory (Current)

### Existing Entities (with dedicated models)

| Entity | Model | Table | Identity | Notes |
|---|---|---|---|---|
| Book | `Book` | `books` | UUID | Central hub; carries legacy primitive fields |
| Author | `Author` | `authors` | UUID | Full entity with `wrote` → Book (many-to-many) |
| Genre | `Genre` | `genres` | UUID | Self-referential hierarchy; `belongs_to` → Book |
| User | `User` | `users` | UUID | Identity + subjective layer |
| ReadingSession | `ReadingSession` | `reading_sessions` | UUID | Temporal event: User ↔ Book |
| Quote | `Quote` | `quotes` | UUID | Content anchored to Book + Session |
| SyncState | `SyncState` | `sync_state` | UUID (FK to User) | Device sync marker |
| ChangeLog | `ChangeLog` | `change_log` | UUID | Audit trail |

### Existing Entities (via KnowledgeNode generic model)

| Node Type | `node_type` value | Count Estimate | Notes |
|---|---|---|---|
| Theme | `theme` | Unknown | Currently duplicated as both `Book.themes` (JSON) and KnowledgeNode |
| Motif | `motif` | Unknown | Same dual storage |
| Atmosphere | `atmosphere` | Unknown | Used by `UserBookExperience` |
| Mood | `mood` | Unknown | Used by `UserBookExperience` |
| Concept | `concept` | Unknown | Not yet used but node_type is available |
| Knowledge Domain | `domain` | Unknown | Available but not populated |

### Current Relations (implemented as database relationships)

| Source | Relation | Target | Implementation |
|---|---|---|---|
| Book | `wrote` (inverse) | Author | `book_authors` junction (many-to-many) |
| Book | `belongs_to` (inverse) | Genre | `book_genres` junction (many-to-many) |
| Author | `wrote` | Book | `book_authors` junction (many-to-many) |
| Book | `has` | User | `user_books` (UserBook) |
| User | `reads` | Book | `reading_sessions` |
| Book | `has` | Quote | `quotes.book_id` FK |
| User | `created` | Quote | `quotes.user_id` FK |
| User | `experiences` | Book | `user_book_experiences` |
| KnowledgeNode | `parent_of` | KnowledgeNode | `knowledge_nodes.parent_id` (self-referential) |
| KnowledgeNode | `relates_to` | KnowledgeNode | `knowledge_relations` (typed edges) |
| Book | `explores` / `evokes` / etc. | KnowledgeNode | `book_knowledge_relations` (typed edges with status) |

### Legacy Primitive Fields on Book (blocking full graph migration)

| Field | Type | Should Be | Priority |
|---|---|---|---|
| `author` | String | Already replaced by many-to-many | Keep for backward compat |
| `genres` | JSON | Already duplicated in `book_genres` | Keep for backward compat |
| `themes` | JSON | `Book ──explores──→ KnowledgeNode(theme)` | High |
| `motifs` | JSON | `Book ──contains──→ KnowledgeNode(motif)` | High |
| `series_name` | String | `Book ──belongs_to──→ Series` (new model) | Medium |
| `series_position` | Integer | Property on the `belongs_to` edge | Medium |
| `original_language` | String | `Book ──written_in──→ Language` (new model) | Low |
| `country_of_origin` | String | `Book ──originates_from──→ Country` (new model) | Low |
| `publication_type` | String | `Book ──published_as──→ PublicationType` (enum node) | Low |

---

## Phase 2: Missing Entities (Next Features)

Every new entity requires: (a) a dedicated model or KnowledgeNode seeding, (b) migration of existing data if applicable, (c) admin CRUD endpoints, (d) UI section in Book Enrichment page.

### High Priority

| Entity | Rationale | Suggested Implementation |
|---|---|---|
| **Series** | `series_name` + `series_position` are primitive fields on Book; books in a series cannot be discovered by series identity. | New `Series` model with `seriess` table, name + description. Many-to-many `book_series` junction with `position` column. Admin CRUD. |
| **Translator** | Books translated by multiple translators need stable identities. | New `Translator` model (parallels `Author`). Many-to-many `book_translators` with optional `language` on the edge. Reuse `Author`-style admin endpoints. |
| **Publisher** | `publisher` does not exist yet; will be needed for editions. | New `Publisher` model. Many-to-many `book_publishers` with optional `year`, `isbn` on the edge. |

### Medium Priority

| Entity | Rationale | Suggested Implementation |
|---|---|---|
| **Universe / Setting** | Books set in the same world (e.g., Marvel, Middle-earth, Warcraft) cannot be grouped. | New `Universe` model or use KnowledgeNode(type=`universe`). Many-to-many `book_universes`. |
| **Character** | Characters appearing across multiple books need identity. | New `Character` model. Many-to-many `book_characters` with optional `role` (protagonist, antagonist, etc.) on the edge. |
| **Historical Event** | Books about or set during specific events. | KnowledgeNode(type=`historical_event`) initially. Dedicated model later if complexity grows. |
| **Award** | Books that have won or been nominated for awards. | New `Award` model. Many-to-many `book_awards` with `year`, `category`, `result` on the edge. |

### Low Priority

| Entity | Rationale | Suggested Implementation |
|---|---|---|
| **Illustrator** | Needed for illustrated editions. | New `Illustrator` model (parallels `Author`). |
| **Language** | `original_language` is a string; ISO codes exist. | New `Language` model seeded from ISO 639-1. Many-to-many `book_languages` with `role` (original, translated) on the edge. |
| **Country** | `country_of_origin` is a string. | New `Country` model seeded from ISO 3166-1. |
| **PublicationType** | `publication_type` is an enum string. | Make it a KnowledgeNode set or a dedicated small model. |

---

## Phase 3: Future Relation Types

Beyond entity models, the existing `BookKnowledgeRelation` system supports arbitrary typed edges. The following relation types should be defined and seeded:

### Objective Relations (admin-maintained)

| Relation | Source | Target | Notes |
|---|---|---|---|
| `explores` | Book | KnowledgeNode(theme, concept) | What the book is about |
| `contains` | Book | KnowledgeNode(motif) | Recurring patterns or symbols |
| `evokes` | Book | KnowledgeNode(atmosphere) | The feeling the book creates |
| `set_in` | Book | Universe, HistoricalEvent | Setting |
| `mentions` | Book | Character, HistoricalEvent, Concept | References within the book |
| `adapts` | Book | Book, Movie, Series | Adaptations |
| `influenced_by` | Book | Book, Author | Literary influence |
| `inspired` | Book | Book, Author, Work | Books this work inspired |
| `translates` | Translator | Book | Translation work |
| `publishes` | Publisher | Book | Publishing relationship |

### Subjective Relations (user-contributed)

| Relation | Source | Target | Notes |
|---|---|---|---|
| `felt` | UserBookExperience | KnowledgeNode(atmosphere, mood) | User's emotional response |
| `reminded_of` | User | Book, Character, Concept | Personal association |
| `tagged` | User | KnowledgeNode | Free-form user tagging |
| `rated` | User | Book | Numeric rating (already in UserBook) |
| `reviewed` | User | Book | Free text review |

### Generic Relations (KnowledgeRelation level — between KnowledgeNodes)

| Relation | Source | Target | Notes |
|---|---|---|---|
| `related_to` | KnowledgeNode | KnowledgeNode | Symmetric general connection |
| `broader_than` | KnowledgeNode | KnowledgeNode | Hierarchical (e.g., "Science Fiction" broader than "Cyberpunk") |
| `narrower_than` | KnowledgeNode | KnowledgeNode | Inverse of broader |
| `similar_to` | KnowledgeNode | KnowledgeNode | Equivalent or strongly related |
| `opposite_of` | KnowledgeNode | KnowledgeNode | Antonym concepts |
| `part_of` | KnowledgeNode | KnowledgeNode | Mereological (e.g., "Identity" is part of "Philosophy") |
| `associated_with` | KnowledgeNode | KnowledgeNode | Weak connection |

---

## Phase 4: Migration Strategy per Primitive Field

### Pattern for Each Migration

1. Create the target entity model (or ensure KnowledgeNode type exists)
2. Create the junction table (or reuse `book_knowledge_relations`)
3. Write a data migration to extract values from the legacy JSON/string field, create entities (find-or-create), and insert junction rows
4. Mark the legacy field as deprecated in the codebase
5. Update admin UI to use the entity-based workflow instead of the text field
6. After a transition period, drop the legacy column

### Priority Order

| Step | What | Depends On |
|---|---|---|
| 1 | Migrate `Book.themes` → KnowledgeNode(`theme`) edges | Nothing (system already supports this) |
| 2 | Migrate `Book.motifs` → KnowledgeNode(`motif`) edges | Nothing |
| 3 | Create `Series` model; migrate `series_name` + `series_position` | Series model + junction |
| 4 | Create `Translator` model | Nothing |
| 5 | Create `Publisher` model | Nothing |
| 6 | Create `Universe` model; migrate from KnowledgeNode if already used | Nothing |
| 7 | Create `Character` model | Nothing |
| 8 | Create `Language` model; migrate `original_language` | Nothing |
| 9 | Create `Country` model; migrate `country_of_origin` | Nothing |

---

## Phase 5: Data Model Changes Required

### New Models to Create

```python
# models/series.py
class Series(Base):
    __tablename__ = "series"
    id = UUID PK
    name = String NOT NULL
    description = Text NULLABLE
    created_at / updated_at

# models/book_series.py (junction)
book_series = Table(
    "book_series",
    Column("book_id", FK -> books.id),
    Column("series_id", FK -> series.id),
    Column("position", Integer, nullable=True),
)

# models/translator.py
class Translator(Base):
    __tablename__ = "translators"
    # Parallels Author model
    id, name, bio, country, birth_year, death_year, created_at, updated_at

# models/book_translators.py (junction)
book_translators = Table(
    "book_translators",
    Column("book_id", FK -> books.id),
    Column("translator_id", FK -> translators.id),
    Column("language", String, nullable=True),
)

# models/publisher.py
class Publisher(Base):
    __tablename__ = "publishers"
    id, name, description, country, website, created_at, updated_at

# models/book_publishers.py (junction)
book_publishers = Table(
    "book_publishers",
    Column("book_id", FK -> books.id),
    Column("publisher_id", FK -> publishers.id),
    Column("year", Integer, nullable=True),
    Column("isbn", String, nullable=True),
)

# models/universe.py
class Universe(Base):
    __tablename__ = "universes"
    id, name, description, created_at, updated_at

# models/character.py
class Character(Base):
    __tablename__ = "characters"
    id, name, description, universe_id (nullable FK), created_at, updated_at
```

### Existing Models to Extend

| Model | Change |
|---|---|
| `Book` | Remove `themes`, `motifs`, `series_name`, `series_position`, `original_language`, `country_of_origin` after migration |
| `Book` | Add `series_id` (optional FK) as a bridge before full Series model migration |
| `BookKnowledgeRelation` | Add support for `user_id` (optional FK) to distinguish subjective relations |

---

## Phase 6: Admin UI Evolution

The Book Enrichment page (`BookEnrichmentPage.tsx`) is the template for entity-based administration. Each new entity should follow the same pattern:

### Pattern for Each Entity Section

1. Show linked entities as chips/tags with remove button
2. Search existing entities with autocomplete
3. Create new entity inline if not found
4. Dedicated API endpoints for link/unlink (`/admin/books/{id}/authors` is the template)

### Order of UI Additions

| Entity | When |
|---|---|
| Themes | After `Book.themes` migration to KnowledgeNode |
| Motifs | After `Book.motifs` migration to KnowledgeNode |
| Series | After Series model creation |
| Translators | After Translator model creation |
| Publishers | After Publisher model creation |
| Universe | After Universe model creation |
| Characters | After Character model creation |

---

## Phase 7: Long-Term Architecture

### Three-Layer Graph

```
┌─────────────────────────────────────────────┐
│              OBJECTIVE LAYER                 │
│  (admin/AI curated, globally true)           │
│                                              │
│  Author ──wrote──→ Book ──explores──→ Theme  │
│  Book ──belongs_to──→ Genre                  │
│  Book ──set_in──→ Universe                   │
└──────────────────────┬──────────────────────┘
                       │
┌──────────────────────▼──────────────────────┐
│             SUBJECTIVE LAYER                 │
│  (user-contributed, personal)               │
│                                              │
│  User ──felt──→ Atmosphere (via experience)  │
│  User ──tagged──→ KnowledgeNode              │
│  User ──rated──→ Book                        │
└──────────────────────┬──────────────────────┘
                       │
┌──────────────────────▼──────────────────────┐
│             KNOWLEDGE LAYER                  │
│  (conceptual, cross-domain)                 │
│                                              │
│  Theme ──related_to──→ Concept               │
│  Concept ──broader_than──→ Concept           │
│  Atmosphere ──similar_to──→ Atmosphere       │
│  Genre ──narrower_than──→ Genre              │
└─────────────────────────────────────────────┘
```

### Graph Traversal API

Future endpoints (not yet implemented):

- `GET /graph/traverse?start=entity_id&relations=explores,evokes&depth=3` — walk the graph
- `GET /graph/recommend?user_id=X&based_on=book_id` — graph-based recommendations
- `GET /graph/related/{book_id}?via=theme,author,genre` — find related books through shared nodes
- `GET /graph/paths?from=entity_id&to=entity_id` — find paths between any two entities

### Events / Triggers

When a relationship is created, the system should be able to:

- Invalidate graph caches
- Queue AI enrichment (propose additional relations)
- Update materialized "related books" lists
- Fire webhooks for external integrations

### Graph Rendering (Future, Not Yet)

The architecture supports a future graph visualization because:

1. Every entity has a stable UUID
2. Every relationship has a source, target, and type
3. The same endpoint (`GET /admin/books/{id}/taxonomy`) returns all relations for a book
4. The same pattern works for any entity type — just change the starting node

No UI changes are needed now. The data model is already graph-compatible.
