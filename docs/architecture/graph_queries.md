# Graph Queries

> Semantic navigation through the knowledge graph.

The graph query API is the first step from catalog navigation (filter by field) to
knowledge navigation (explore by connection). Instead of asking "what books match
this genre," it asks "what books are connected to this book, and why?"

---

## Endpoints

### GET /graph/books/{book_id}/related

Find books related to a given book through shared graph entities.

**Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `book_id` | UUID (path) | — | The book to find related books for |
| `limit` | int (query) | 10 | Max results (1-50) |

**Response:**

```json
[
  {
    "book_id": "uuid",
    "title": "1984",
    "author": "George Orwell",
    "score": 0.45,
    "shared_nodes": [
      {"id": "uuid", "name": "Power", "type": "theme", "relation_type": "explores"},
      {"id": "uuid", "name": "Totalitarianism", "type": "concept", "relation_type": "classified_as"}
    ]
  }
]
```

**Scoring:**

Each pair of books is scored by Weighted Jaccard Similarity over their
connected KnowledgeNodes. The weights prioritize node types that are more
semantically meaningful:

| Node type | Weight | Rationale |
|---|---|---|
| `concept` | 1.0 | Abstract ideas are the strongest signal |
| `theme` | 0.9 | Thematic overlap is highly meaningful |
| `motif` | 0.8 | Structural elements add secondary signal |
| `atmosphere` | 0.7 | Mood is useful but more subjective |

**Example:**

```
GET /graph/books/{dune_id}/related?limit=5

Returns: 1984 (shared: Power, Totalitarianism),
         The Master and Margarita (shared: Power),
         Brave New World (shared: Freedom)
```

---

### GET /graph/path

Discover a connection path between any two nodes in the graph.

**Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `source_node_id` | UUID (query) | — | Starting node |
| `target_node_id` | UUID (query) | — | Target node |
| `max_depth` | int (query) | 6 | Maximum path length (1-10) |

**Response (found):**

```json
{
  "found": true,
  "path": [
    {"id": "uuid", "type": "book", "name": "Dune"},
    {"id": "uuid", "type": "theme", "name": "Power"},
    {"id": "uuid", "type": "book", "name": "1984"}
  ],
  "length": 3
}
```

**Response (not found):**

```json
{
  "found": false,
  "path": [],
  "length": 0
}
```

**Traversal rules:**

The BFS walks through these edges in both directions:

| From | Via | To |
|---|---|---|
| Book | `book_authors` | Author |
| Author | `book_authors` | Book |
| Book | `book_genres` | Genre |
| Genre | `book_genres` | Book |
| Book | `book_knowledge_relations` (approved) | KnowledgeNode |
| KnowledgeNode | `book_knowledge_relations` (approved) | Book |
| KnowledgeNode | `knowledge_relations` | KnowledgeNode |

**Example:**

```
GET /graph/path?source_node_id={dune_id}&target_node_id={1984_id}

Path: Dune ──explores──→ Power ──explores──→ 1984
      (length 3)

GET /graph/path?source_node_id={dune_id}&target_node_id={ring_motif_id}

Path: Dune ──wrote──→ Frank Herbert (different author, but
      if no direct connection, the BFS would find a longer path
      through shared themes or concepts)
```

---

## Service Layer

### backend/app/graph/similarity.py

| Function | Purpose |
|---|---|
| `get_book_node_map(db, book_id)` | Fetch all KnowledgeNode IDs connected to a book, grouped by type |
| `jaccard_similarity(a, b)` | Jaccard index for two sets |
| `score_from_node_maps(map_a, map_b)` | Weighted aggregate similarity from pre-computed node maps |
| `calculate_book_similarity(db, book_id, limit)` | Full related-books pipeline: fetch, score, rank |

### Relationship to the graph service

```
graph/service.py       — single-book graph projection (traversal)
graph/similarity.py    — cross-book comparison (similarity)
graph/traversal.py     — low-level neighbor queries (shared)
graph/serializer.py    — entity-to-dict conversion (shared)
```

The similarity service reuses `get_book_node_map` to fetch node data,
then applies Jaccard + weighted scoring entirely in memory.

---

## Design decisions

1. **No ML, no AI.** All scoring is deterministic set overlap. This makes
   every result explainable ("these books share the theme Power").

2. **Shared nodes are returned with the score.** The frontend can display
   *why* two books are related, not just that they are.

3. **Path discovery is BFS, not Dijkstra.** There are no edge weights in
   the path endpoint. All edges are treated equally. Weighted path finding
   is left for future phases.

4. **Approved relations only.** Both endpoints respect the moderation
   workflow: only `status = "approved"` BookKnowledgeRelations are used.
   Proposed or rejected relations are invisible in the public API.

5. **The same graph format.** Path steps use `{id, type, name}` which is
   a subset of the full graph node format from `GET /books/{id}/graph`.
   Clients can render path results using the same component as graph results.

---

## From catalog to knowledge

Before these endpoints:

- "Find books like Dune" → filter by genre (science-fiction)
- Result: all science fiction books, regardless of actual relevance

After these endpoints:

- "Find books like Dune" → traverse shared themes, concepts, motifs
- Result: 1984 (shared Power theme), Brave New World (shared Freedom concept),
  The Master and Margarita (shared Power theme)
- Each result explains *why*

This is the architectural shift: the graph does not replace the catalog.
It adds a layer of semantic navigation that the catalog cannot provide.
