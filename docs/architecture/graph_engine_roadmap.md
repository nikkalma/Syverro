# Graph Engine Roadmap

> Evolution of Syverro's graph engine from storage to traversal to personalization.

---

## Phase 1: Graph Storage (Complete)

The foundation is in place and operational.

### What exists

- `KnowledgeNode` — generic entity node with type, slug, hierarchy, JSONB metadata
- `KnowledgeRelation` — typed, weighted, directed edge between two KnowledgeNodes
- `BookKnowledgeRelation` — typed edge from Book to KnowledgeNode with provenance (source), moderation status, confidence
- `UserBookExperience` — subjective user-to-book-to-atmosphere/mood connections (model + schema exist; no API endpoints yet)
- `book_authors` — many-to-many junction (Book ↔ Author)
- `book_genres` — many-to-many junction (Book ↔ Genre)

### What was added in this phase

- `graph/service.py` — orchestrator that produces `{ nodes, relations }` format
- `graph/traversal.py` — isolated database query layer
- `graph/serializer.py` — standardized entity-to-dict conversion
- `graph/ranking.py` — scoring interface placeholders
- `GET /books/{book_id}/graph` — depth-parameterized graph read endpoint
- API routes no longer contain graph logic

### What is NOT yet done

- `UserBookExperience` has no API endpoints (model + table exist, but no way to create or read via API)
- `Book.themes` and `Book.motifs` JSON fields are still the primary storage for theme/motif data; KnowledgeNode-based storage is parallel but unused by the enrichment UI
- No migration has copied legacy JSON data into `book_knowledge_relations`

---

## Phase 2: Graph Traversal (Current)

The ability to navigate the graph programmatically.

### Current capability

| Operation | Status |
|---|---|
| Single book graph (depth 1-2) | Implemented via `GET /books/{book_id}/graph` |
| Direct neighbor lookup | Implemented in `traversal.py` |
| KnowledgeRelation expansion | Implemented in `traversal.py` |
| Multi-hop traversal | Service layer ready; traversal function signatures exist |
| Path finding | Not implemented |

### Next traversal endpoints (to be built)

These return the same `{ nodes, relations }` format as the book graph endpoint.

```
GET /graph/traverse?start={node_id}&depth={n}
```

Follow edges from any node (not just books) up to depth `n`. This is the generic graph explorer.

```
GET /graph/related/{book_id}?limit={n}
```

Find books similar to the given book by counting shared connected nodes (same author, same genre, same theme, etc.). Uses `ranking.py` scoring functions.

```
GET /graph/paths?from={node_id}&to={node_id}
```

Find a path between any two nodes in the graph. Uses BFS on KnowledgeRelations and BookKnowledgeRelations.

### Service layer pattern for all traversal

Every traversal endpoint follows the same pattern:

1. API route validates input parameters
2. Calls `graph/service.py` with traversal parameters
3. `traversal.py` executes database queries (recursive CTEs, multi-step joins)
4. `serializer.py` converts all discovered entities to standard format
5. Returns `{ nodes, relations }`

No API route contains a database query, a serialization step, or a traversal algorithm.

---

## Phase 3: Graph Ranking (Next)

Scoring the strength of connections in the graph.

### Interface (already defined in ranking.py)

```
same_author_score(book_a, book_b, shared_count) → float
same_genre_score(book_a, book_b, shared_count, total_count) → float
same_theme_score(book_a, book_b, shared_count) → float
same_atmosphere_score(book_a, book_b, shared_count) → float
same_concept_score(book_a, book_b, shared_count) → float
graph_similarity_score(book_a, book_b) → float    # aggregate
relevance_score(book, user) → float               # personalized
```

### Current state

All functions return `0.0`. They serve as a specification of what the ranking engine will compute.

### Implementation plan

1. Implement `same_author_score` — count shared authors via `book_authors`, weigh by whether the author is primary (legacy FK) or linked
2. Implement `same_genre_score` — Jaccard similarity on genre sets from `book_genres`
3. Implement `same_theme_score` — count shared `KnowledgeNode` connections where `relation_type = "explores"` and `status = "approved"`
4. Implement `graph_similarity_score` — weighted sum of all component scores
5. Add caching layer (optional) for precomputed similarity matrices

### Use case

```
GET /books/{book_id}/related?limit=10
```

Returns the top `limit` books ordered by `graph_similarity_score`, each as a graph node with the similarity score in metadata.

---

## Phase 4: Similarity Engine (Future)

Cross-book graph analysis beyond direct connections.

### What the similarity engine adds

- Recommend books that share **indirect** connections (e.g., Book A shares Theme T with Book B, and Book B shares Author A with Book C — therefore Book C may be relevant to a reader of Book A)
- Collaborative filtering via shared user reading patterns
- Content-based filtering via graph embeddings

### Architecture

```python
# graph/similarity.py  (not yet created)

class SimilarityEngine:
    async def by_shared_nodes(self, book_id) -> list[ScoredBook]:
        """Books ranked by overlapping graph neighborhood."""

    async def by_graph_embedding(self, book_id) -> list[ScoredBook]:
        """Books ranked by embedding distance (requires embedding model)."""

    async def by_user_history(self, user_id) -> list[ScoredBook]:
        """Personalized recommendations from reading history + graph position."""
```

### No implementation yet

Phase 4 is research. The architecture must support it, but no code should be written until Phases 2-3 are proven in production.

---

## Phase 5: Personal Knowledge Graph (Vision)

Each user's subjective layer becomes a first-class graph.

### What exists already

- `UserBookExperience` model — stores user's atmosphere/mood connection to a book
- `User` model — already a UUID entity, ready to be a graph node

### What needs to be built

1. **UserBookExperience CRUD endpoints** — so users can record how a book made them feel
2. **User as graph node** — `GET /users/{user_id}/graph` returns the user's reading graph (books read, experiences recorded, quotes saved)
3. **Subjective edge type support** — extend `BookKnowledgeRelation` (or create a parallel model) to allow users to tag books with knowledge nodes without affecting the objective layer
4. **Privacy layer** — subjective edges are private by default; users choose what to share

### Three-layer graph (vision)

```
Objective layer (curated by admin/moderator/AI)
  Author ──wrote──→ Book ──explores──→ Theme
  Book ──belongs_to──→ Genre
  Book ──evokes──→ Atmosphere

Subjective layer (personal to each user)
  User ──felt──→ Atmosphere (via UserBookExperience)
  User ──rated──→ Book
  User ──tagged──→ KnowledgeNode

Knowledge layer (conceptual, between nodes)
  Theme ──related_to──→ Concept
  Concept ──broader_than──→ Concept
  Atmosphere ──similar_to──→ Atmosphere
```

### Future API

```
GET /users/{user_id}/graph            # user's personal graph (private)
GET /users/{user_id}/recommendations  # personalized recommendations
POST /users/{user_id}/graph/merge     # share/submit subjective data to objective layer
```

---

## Summary

| Phase | Name | Status | Key Deliverable |
|---|---|---|---|
| 1 | Graph Storage | ✅ Complete | Models, service layer, `GET /books/{id}/graph` |
| 2 | Graph Traversal | 🔄 In progress | Multi-hop traversal, related books, path finding |
| 3 | Graph Ranking | 📋 Defined | Scoring functions, similarity endpoint |
| 4 | Similarity Engine | 🔮 Research | Embeddings, collaborative filtering |
| 5 | Personal KG | 🔮 Vision | User graph, subjective layer, privacy |

### Guiding principle

> Move from "What fields do we add?" to "What nodes exist? What relationship is created? What traversal is required?"
