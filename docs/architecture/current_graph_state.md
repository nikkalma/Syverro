# Current Graph State

> An honest assessment of what exists, what is legacy, and what the first working scenario looks like.

---

## 1. Existing Graph-Capable Entities

These are entities with stable UUID identity and a dedicated database model. They can already function as graph nodes.

| Entity | Model | Table | Has CRUD Endpoints | Used in Practice |
|---|---|---|---|---|
| **Book** | `Book` | `books` | Yes — public + admin | Central hub; every feature uses it |
| **Author** | `Author` | `authors` | Yes — admin CRUD | Created on book creation; manageable via admin |
| **Genre** | `Genre` | `genres` | Yes — admin CRUD + tree | Created via admin; linked on enrichment |
| **KnowledgeNode** | `KnowledgeNode` | `knowledge_nodes` | Yes — admin CRUD + public list | Can be created but not yet used in enrichment UI |
| **User** | `User` | `users` | Partial — admin user management | Identity node for subjective layer |
| **ReadingSession** | `ReadingSession` | `reading_sessions` | No — only created via sync | Temporal event, sync-only |
| **Quote** | `Quote` | `quotes` | No — only created via sync | Content node, sync-only |
| **UserBook** | `UserBook` | `user_books` | No — created implicitly on book add | User↔Book ownership/status edge |

### Graph-Capable but No Endpoints

| Entity | Model | Table | Notes |
|---|---|---|---|
| **UserBookExperience** | `UserBookExperience` | `user_book_experiences` | Schema exists, model exists, **zero API endpoints**. Completely unusable. |

---

## 2. Existing Relationships

### Implemented as Database Relations with Working Endpoints

| Source | Relation | Target | Implementation | Endpoints |
|---|---|---|---|---|
| **Book** | `wrote` (inverse) | **Author** | `book_authors` junction table (many-to-many) | `GET/POST/DELETE /admin/books/{id}/authors` |
| **Book** | `belongs_to` (inverse) | **Genre** | `book_genres` junction table (many-to-many) | `_sync_book_genres` in admin enrichment, genre tree |
| **Author** | `wrote` | **Book** | `book_authors` junction table | Same as above |
| **Book** | `explores` / `evokes` / `contains` / `classified_as` | **KnowledgeNode** | `book_knowledge_relations` table | `POST/PUT/GET/DELETE /admin/books/{book_id}/taxonomy` |
| **KnowledgeNode** | `related_to` / `part_of` / etc. | **KnowledgeNode** | `knowledge_relations` table | `POST/DELETE /admin/taxonomy/relations` |
| **User** | `owns` | **Book** | `user_books` table (UserBook) | Implicit — created on `POST /books/` |
| **User** | `reads` | **Book** | `reading_sessions` table | Sync only — `POST /sync/push` |

### Implemented as Database Relations but No Dedicated Endpoints

| Source | Relation | Target | Implementation |
|---|---|---|---|
| **Book** | `has` | **Quote** | `quotes.book_id` FK |
| **ReadingSession** | `contains` | **Quote** | `quotes.session_id` FK |
| **User** | `created` | **Quote** | `quotes.user_id` FK |
| **KnowledgeNode** | `parent_of` | **KnowledgeNode** | `knowledge_nodes.parent_id` self-referential FK |
| **Genre** | `parent_of` | **Genre** | `genres.parent_id` self-referential FK |

### Missing from Response Builders

Despite having all the infrastructure for book-knowledge relations (`book_knowledge_relations` table, admin CRUD endpoints, public GET /taxonomy/books/{id}/nodes, schema), the **main book response builders do not include them**:

- `_build_book_dict()` (admin metadata endpoint) — loads authors and genres but **NOT** `book_knowledge_relations`. Themes and motifs are returned as raw JSON arrays from the legacy `Book.themes` and `Book.motifs` columns.
- `_book_to_response_dict()` (public book endpoint) — loads legacy single-author via `author_ref` FK, and genres via `book_genres`. No knowledge node data at all.

This means the admin metadata page and all public book views are **blind to the knowledge graph** that already exists for a book.

---

## 3. Legacy Fields That Should Become Relations

These are primitive fields on the `Book` model that the architecture vision says should be graph edges.

| Column | Type | Current Status | Target | Migration Ready |
|---|---|---|---|---|
| `Book.author` | `String` | Legacy denormalized string | Already replaced by `book_authors` many-to-many | Yes — kept for backward compat |
| `Book.author_id` | `UUID FK` | Single-author FK to `authors` | Should be deprecated in favor of `book_authors` | No — still used by public API and book creation |
| `Book.genres` | `JSON` | Duplicated with `book_genres` | Drop in favor of junction table | Partial — junction table is source of truth in admin |
| `Book.themes` | `JSON` | **Only** stored as JSON array | `BookKnowledgeRelation(relation_type="explores")` to KnowledgeNode(type="theme") | **No** — no migration has run; enrichment UI still shows text field |
| `Book.motifs` | `JSON` | **Only** stored as JSON array | `BookKnowledgeRelation(relation_type="contains")` to KnowledgeNode(type="motif") | **No** — same as themes |
| `Book.series_name` | `String` | Free-text field | `Book ──belongs_to──→ Series` (new model) | **No** — no Series model exists |
| `Book.series_position` | `Integer` | Free-text number | Property on the `belongs_to` edge | **No** — same |
| `Book.original_language` | `String` | Free-text field | `Book ──written_in──→ Language` | **No** — no Language model |
| `Book.country_of_origin` | `String` | Free-text field | `Book ──originates_from──→ Country` | **No** — no Country model |

**Critical finding**: `themes` and `motifs` are the most immediately actionable — the `KnowledgeNode` model and `BookKnowledgeRelation` table already exist, admin taxonomy endpoints already work. The gap is purely in the **book enrichment UI** and the **response builders** that don't include the graph data.

---

## 4. Current Gaps Between Vision and Actual Code

### Gap 1: Response Builders Don't Include the Graph

The vision says "a book is a hub that connects many entities." But neither the admin nor the public response builder assembles the full graph. To get a book's connected world today, a developer must call **four separate endpoints**:

```
Response (admin metadata) — returns: authors, genres, raw themes[], raw motifs[]
GET /taxonomy/books/{id}/nodes — returns: book-knowledge relations (if approved)
GET /admin/books/{id}/taxonomy — returns: all book-knowledge relations (admin view)
No endpoint — returns: UserBookExperience data (no endpoints exist)
```

### Gap 2: Book Enrichment UI Doesn't Use the Taxonomy System

The enrichment page (`BookEnrichmentPage.tsx`) has:
- Author section — **uses** dedicated endpoints (entity-based, correct)
- Genre multi-select — **uses** the `book_genres` junction (entity-based, correct)
- Themes text input — **stores** to `Book.themes` JSON (primitive, wrong)
- Motifs text input — **stores** to `Book.motifs` JSON (primitive, wrong)

The admin taxonomy endpoints (`POST /admin/books/{id}/taxonomy`) exist and work, but the enrichment page does not use them.

### Gap 3: No Endpoint for UserBookExperience

The `UserBookExperience` model has no API endpoints at all — no CRUD, no list, no create. The schema exists. The model exists. The table was created by migration `0002_knowledge_graph`. But there is no way to create or read a user's experience data through the API.

### Gap 4: Public Book Responses Use Legacy Author Relationship

The public `_book_to_response_dict()` reads authors via `book.author_ref` (the legacy FK one-to-many), not via `book_authors` (the new many-to-many). This means:
- If a book has multiple authors linked via `book_authors`, the public API only shows the one set in `author_id`
- The many-to-many author relationship is only visible in admin endpoints

### Gap 5: No Unified Book Graph Endpoint

No endpoint exists that returns a book with all its connected entities in one response. A frontend that wants to display "this book's world" must make multiple round trips and assemble the data itself.

### Gap 6: No Public Read Endpoint for BookKnowledgeRelations

The public `/taxonomy/books/{id}/nodes` returns only `approved` relations. There is no public endpoint that returns `proposed` relations (appropriate, since they're unmoderated). But there is also no endpoint that returns knowledge nodes grouped by `relation_type` — the frontend would need to sort them itself.

---

## 5. First Minimal Graph Traversal Scenario

> "Open a book and retrieve its connected world."

### Scenario

Given a book ID, return everything connected to it in a single response:

```
Book
├── Authors         (book_authors junction)
├── Genres          (book_genres junction)
├── Themes          (book_knowledge_relations where relation_type = "explores")
├── Motifs          (book_knowledge_relations where relation_type = "contains")
├── Atmospheres     (book_knowledge_relations where relation_type = "evokes")
└── Other nodes     (book_knowledge_relations with any type)
```

### What a Client Must Do Today

A frontend developer building "Book Connected World" today needs **two separate API calls** and must ignore the legacy JSON fields:

```
1. GET /admin/metadata/books/{book_id}
   → Returns: authors[], genre_objects[], themes[], motifs[] (raw JSON — WRONG source)

2. GET /taxonomy/books/{book_id}/nodes
   → Returns: BookKnowledgeResponse with relations[] (correct, but only approved)

Manual assembly required: ignore themes[]/motifs[] from call 1, merge call 2 into response.
```

### What the Next Technical Step Looks Like

The smallest change that makes the scenario work is a **single new endpoint** that assembles the full graph for a book. No new models, no migrations.

```python
# Pseudocode for the minimal change:
# New file: backend/app/api/graph.py (or add to an existing router)

@router.get("/books/{book_id}/graph")
async def get_book_graph(book_id: UUID, db: AsyncSession) -> dict:
    """Return a book's full connected world: authors, genres, knowledge nodes."""

    book = await db.get(Book, book_id)

    # 1. Authors from book_authors
    authors = await db.execute(
        select(Author).join(book_authors).where(book_authors.c.book_id == book_id)
    )

    # 2. Genres from book_genres
    genres = await db.execute(
        select(Genre).join(book_genres).where(book_genres.c.book_id == book_id)
    )

    # 3. Knowledge nodes from book_knowledge_relations
    #    Grouped by relation_type so the frontend can render
    #    "Themes", "Motifs", "Atmospheres" sections
    relations = await db.execute(
        select(BookKnowledgeRelation, KnowledgeNode)
        .join(KnowledgeNode, KnowledgeNode.id == BookKnowledgeRelation.node_id)
        .where(BookKnowledgeRelation.book_id == book_id)
    )

    return {
        "book_id": book.id,
        "title": book.title,
        "authors": [...],
        "genres": [...],
        "knowledge": {
            "explores": [...],    # Themes
            "contains": [...],    # Motifs
            "evokes": [...],      # Atmospheres/feelings
            "other":  [...]       # Any other relation_type found
        }
    }
```

This endpoint:

1. **Uses only existing infrastructure** — no new models, no migrations, no schema changes
2. **Returns data grouped by relation_type** — the frontend can render sections without parsing
3. **Replaces the legacy JSON fields** — themes and motifs are now represented as entity relationships, not strings
4. **Serves as the single source of truth** for a book's graph — no more manual assembly

### What Changes After This Endpoint Exists

| Before | After |
|---|---|
| Frontend calls 2+ endpoints and merges | Frontend calls 1 endpoint |
| Themes/motifs returned as raw `JSON` arrays | Themes/motifs returned as `KnowledgeNode` entities with stable UUIDs |
| Legacy fields are the only source for themes/motifs | Graph is the canonical source; legacy JSON is ignored |
| No way to distinguish approved vs proposed nodes | Status field on each relation lets the frontend filter |
| Book enrichment UI can't show knowledge nodes | Enrichment UI can display and manage nodes |

### Future Endpoint (when user experience layer is added)

```python
@router.get("/books/{book_id}/graph")
async def get_book_graph(
    book_id: UUID,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = ...
):
    # Returns the same data as above, plus:
    # - current_user's UserBookExperience (atmosphere, mood, intensity)
    # - if admin: proposed (unmoderated) relations too
```

---

## 6. First Graph Read API

> This section documents the endpoint that has been implemented.

### Endpoint

```
GET /books/{book_id}/graph
```

Public (no authentication required). Returns only `approved` `BookKnowledgeRelation`s.

### Response format

```json
{
  "nodes": [
    { "id": "uuid", "type": "book|author|genre|theme|motif|atmosphere|concept|...", "name": "string", "metadata": {} }
  ],
  "relations": [
    { "source": "uuid", "target": "uuid", "relation_type": "wrote|belongs_to|explores|contains|evokes|related_to|..." }
  ]
}
```

### What it returns

| Source | Relation type | Target | Data source |
|---|---|---|---|
| Book | — | itself | `books` table |
| Author | `wrote` | Book | `book_authors` junction |
| Book | `belongs_to` | Genre | `book_genres` junction |
| Book | `explores` / `contains` / `evokes` / ... | KnowledgeNode | `book_knowledge_relations` (approved only) |
| KnowledgeNode | any | KnowledgeNode | `knowledge_relations` (where either node is connected to the book) |

### Node types by data source

| Source | node `type` value |
|---|---|
| `Book` | `"book"` |
| `Author` | `"author"` |
| `Genre` | `"genre"` |
| `KnowledgeNode` | the node's `node_type` field (e.g. `"theme"`, `"motif"`, `"atmosphere"`, `"concept"`, `"domain"`) |

### Design decisions

1. **Flat `nodes` + `relations` format** — not grouped by type. The client can group by `type` or `relation_type` as needed. This format is the simplest graph serialization and matches the existing `KnowledgeGraphResponse` schema pattern.

2. **KnowledgeRelation traversal** — when a KnowledgeNode is connected to a book, the endpoint also follows its outgoing `knowledge_relations` edges. This reveals the graph beyond the first hop (e.g., Theme → related Concept → related Domain). KnowledgeNodes discovered this way are included even if they have no direct book connection.

3. **Approved-only** — only `BookKnowledgeRelation`s with `status = "approved"` are returned. Proposed/rejected relations are reserved for admin endpoints. This keeps the public graph clean.

4. **No pagination** — a single book's graph is assumed to fit in one response. Pagination can be added later if a book accumulates hundreds of connected nodes.

### What this endpoint is NOT

- Not a replacement for the admin enrichment endpoint
- Not a CRUD interface for the graph
- Not a visualization endpoint

It is a read-only graph projection centered on one book.

### Foundation for future exploration

This endpoint is the foundation for:

- `GET /graph/traverse?start={node_id}&depth=3` — recursive graph walk in any direction
- `GET /graph/related/{book_id}` — find similar books via shared nodes
- `GET /graph/paths?from={node_id}&to={node_id}` — shortest path discovery
- Client-side graph rendering — the flat `nodes`+`relations` format maps directly to any graph visualization library (D3.js, vis.js, Cytoscape, etc.)

Every future graph API will return the same `{ nodes: [], relations: [] }` shape, making it straightforward to compose responses and build a unified graph view.

---

## 7. Graph Service Layer

> The graph service layer isolates all graph logic from API routes.

### Architecture

```
API route (api/graph.py)           ←  HTTP concerns only
      │
      ▼
Graph service (graph/service.py)   ←  Orchestration
      │
      ├──► graph/traversal.py      ←  Database queries
      ├──► graph/serializer.py     ←  Object → dict conversion
      └──► graph/ranking.py        ←  Scoring interfaces (future)
```

### File responsibilities

| File | Role |
|---|---|
| `graph/__init__.py` | Public exports (`get_book_graph`) |
| `graph/service.py` | Orchestrator. Calls traversal, passes results to serializer. No HTTP knowledge. Returns `{ nodes: [], relations: [] }` or `None`. |
| `graph/traversal.py` | Pure database queries. Returns ORM objects. Functions: `get_book()`, `get_direct_neighbors()`, `get_knowledge_relations_for_nodes()`, `get_knowledge_nodes_by_ids()`. |
| `graph/serializer.py` | Converts ORM objects to the standard graph dict format. One function per entity type (`serialize_book`, `serialize_author`, `serialize_genre`, `serialize_knowledge_node`) plus `relation()` for edges. |
| `graph/ranking.py` | Placeholder scoring functions for future recommendation engine. All return 0.0 today. |

### What the API route now does (and does not do)

```python
# api/graph.py — before refactor
# Contained raw SQLAlchemy queries, serialization logic, dedup logic — all inline.

# api/graph.py — after refactor
@router.get("/{book_id}/graph")
async def book_graph(book_id, depth, db):
    result = await get_book_graph(db, book_id, depth=depth)
    if result is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return result
```

The route now:
- Parses and validates query parameters (`depth`, bounds-checked by FastAPI)
- Calls the service
- Maps `None` to HTTP 404
- Returns the response

The route does NOT:
- Query the database directly
- Know about `book_authors`, `book_genres`, or `book_knowledge_relations` tables
- Construct node or relation dicts
- Deduplicate entities
- Handle graph traversal logic

### Design rule

All future graph features (traversal, recommendation, similarity) must go through the service layer. API routes must remain thin wrappers.

### Depth parameter

`GET /books/{book_id}/graph?depth=1`

| depth | Returns | Use case |
|---|---|---|
| 0 | Book node only | Minimal metadata |
| 1 | Book + direct neighbors (authors, genres, knowledge nodes) | Book detail page |
| 2 | Depth 1 + KnowledgeRelations between connected nodes | Graph exploration |

Maximum depth is 2 (enforced by `MAX_DEPTH` in `service.py`). Unlimited expansion is not allowed.

### Future consumers

The same `{ nodes: [], relations: [] }` format will be used by:

- **Recommendation engine** — `ranking.py` will compute similarity scores, then the service returns related books as graph nodes
- **Graph traversal API** — `GET /graph/traverse?start={id}&depth=3` will reuse the same service, traversal, and serializer modules
- **Visualization clients** — any graph rendering library (D3.js, Cytoscape, vis.js) can consume the format without transformation

### What was added in this phase: graph queries

Two new endpoints that operate on top of the graph service layer:

| Endpoint | Purpose | Scoring |
|---|---|---|
| `GET /graph/books/{book_id}/related` | Find books by shared graph nodes | Weighted Jaccard similarity (themes, motifs, atmospheres, concepts) |
| `GET /graph/path` | Connection path between any two nodes | BFS (equal edge weight) |

These endpoints live in a separate file (`api/graph_queries.py`) and use a dedicated
similarity service (`graph/similarity.py`). They follow the same architecture rule:
API routes validate input, service modules contain all logic.

---

## 8. Reference Knowledge Graph Dataset

> A curated seed dataset for validating graph traversal, similarity scoring, and future visualization.

### Location

`backend/app/seeds/knowledge_graph_seed.py`

### Purpose

This dataset is NOT production data. It exists to:

1. **Validate that the graph model can represent meaningful literary worlds** — themes connect to books, concepts relate to other concepts, atmospheres are distinct from motifs, and the graph reveals structure that a flat record cannot.
2. **Provide a stable testbed for traversal** — `GET /books/{book_id}/graph?depth=2` returns a rich, multi-hop graph that exercises all parts of the service layer.
3. **Enable similarity scoring development** — with real literary relationships in place, `ranking.py` can be developed and tested against known affinities (e.g., Dune and 1984 both explore `power`).
4. **Give frontend development a realistic dataset** — the enrichment UI, book detail pages, and any future graph view will have meaningful data to render.

### Dataset composition

| Entity type | Count | Examples |
|---|---|---|
| Themes | 26 | Power, Ecology, Consciousness, Freedom, Guilt |
| Motifs | 23 | Desert, Doublethink, Ocean, Journey, Dream |
| Atmospheres | 15 | Epic, Dystopian, Melancholic, Whimsical, Surreal |
| Concepts | 16 | Messiah Complex, Totalitarianism, Hero's Journey, Absurdism |
| **Nodes total** | **80** | |
| **Node relations** | **20** | `related_to`, `contrasts_with`, `part_of`, `explores`, `belongs_to`, `similar_to` |
| **Books** | **8** | Dune, 1984, Solaris, The Hobbit, Sapiens, Brave New World, The Master and Margarita, Crime and Punishment |

### Books and their graph

| Book | Themes | Motifs | Atmospheres | Concepts |
|---|---|---|---|---|
| Dune | Power, Ecology, Religion, Destiny | Desert, Spice, Prophecy | Epic, Mystical | Messiah Complex, Ecological Engineering |
| 1984 | Power, Truth, Freedom, Surveillance | Doublethink, Big Brother, Thought Police | Dystopian, Oppressive | Totalitarianism, Newspeak |
| Solaris | Consciousness, Communication, Isolation, Identity | Ocean, Memory, Doppelganger | Melancholic, Philosophical | The Other, Phenomenology |
| The Hobbit | Adventure, Courage, Greed | Journey, Dragon, Ring | Whimsical, Epic | Hero's Journey, Transformation |
| Sapiens | Evolution, Civilization, Culture, History | Revolution, Narrative | Intellectual, Expansive | Cognitive Revolution, Collective Myth |
| Brave New World | Happiness, Freedom, Identity | Conditioning, Soma, Caste System | Clinical, Unsettling | Utopia and Dystopia |
| Master and Margarita | Good vs Evil, Love, Art, Power | Devil, Carnival, Disappearance | Surreal, Satirical | Absurdism, Redemption |
| Crime and Punishment | Guilt, Redemption, Suffering, Morality | Crime, Confession, Dream | Psychological, Intense | Utilitarianism, Nihilism |

### Inter-node relations (for depth-2 traversal)

The dataset includes 20 `KnowledgeRelation` edges between nodes, such as:

- `power` → `totalitarianism` (related_to)
- `freedom` → `surveillance` (contrasts_with)
- `consciousness` → `the-other` (explores)
- `hero-journey` → `transformation` (part_of)
- `guilt` → `redemption` (contrasts_with)
- `nihilism` → `absurdism` (related_to)

These enable `GET /books/{book_id}/graph?depth=2` to return nodes that are not directly connected to the book but related through the knowledge graph.

### Running the seed

The script uses the existing ORM models and is idempotent:

```python
from app.seeds.knowledge_graph_seed import seed_knowledge_graph
await seed_knowledge_graph(db)
```

It requires that books already exist in the database (from the main seed in `main.py` or manual creation). If a book is not found, it logs a warning and skips it.

### What this enables

| Capability | How the dataset helps |
|---|---|
| `GET /books/{id}/graph?depth=1` | Returns 8-12 connected nodes per book |
| `GET /books/{id}/graph?depth=2` | Returns additional concept nodes via KnowledgeRelation traversal |
| `graph/ranking.py` similarity | Dune and 1984 share `power`; Solaris and 1984 share `identity` — scoring functions can be tested |
| Graph visualization | 80 nodes + 20 relations + ~80 book connections = a meaningful graph to render |
| Admin taxonomy UI | Moderators can explore existing nodes and propose new connections |

---

## Summary: What to Build Next

### Implemented ✅

1. **`GET /books/{book_id}/graph`** — single-book graph projection with depth parameter. See §6.

2. **Graph service layer** — `graph/service.py`, `graph/traversal.py`, `graph/serializer.py`, `graph/ranking.py`. See §7.

3. **Knowledge graph seed dataset** — 80 nodes, 20 relations, 8 books with ~84 connections. See §8.

4. **`GET /graph/books/{book_id}/related`** — ranked related books via shared graph nodes. See `docs/architecture/graph_queries.md`.

5. **`GET /graph/path`** — BFS path discovery between any two nodes. See `docs/architecture/graph_queries.md`.

6. **`graph/similarity.py`** — weighted Jaccard similarity scoring.

### Next (no new models, no migrations)

7. **Update `_build_book_dict`** to include knowledge nodes (or deprecate its legacy `themes`/`motifs` fields in favor of the graph endpoint).

8. **Update `BookEnrichmentPage.tsx`** Themes and Motifs sections to use:
   - `POST /admin/books/{id}/taxonomy` (already exists) to create `explores`/`contains` relations
   - `DELETE /admin/books/{id}/taxonomy/{relation_id}` (already exists) to remove them
   - Stop writing to `Book.themes` and `Book.motifs` JSON fields

9. **✅ Run knowledge graph seed on startup** — `seed_knowledge_graph(db)` is called in `main.py` startup after `seed_books()`.

### Short-term (new endpoints, no new models)

10. **`UserBookExperience` CRUD endpoints** — POST, GET, PUT, DELETE so users can record atmosphere/mood/intensity for a book.

11. **Public many-to-many authors** — update `_book_to_response_dict()` to read from `book_authors` instead of the legacy `author_ref` FK.

### Medium-term (new models + migrations)

12. **Series, Translator, Publisher, Universe, Character** models per the migration roadmap.
