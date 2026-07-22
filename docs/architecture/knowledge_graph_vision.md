# Knowledge Graph Vision

> Syverro does not store books. Syverro stores relationships.

## Why Syverro Became Graph-First

The traditional library model stores books as records with typed fields:

```
Book
  ├── title: str
  ├── author: str
  ├── genre: str
  ├── theme: str
  └── description: str
```

This design has a fundamental limitation: every real-world connection between things must be compressed into a primitive string or scalar. The author is a name, the genre is a label, the theme is a keyword. The relationships themselves — *who wrote this*, *what explores that*, *how does this relate to that* — are lost.

A knowledge graph inverts this. Instead of starting with "what fields does a book have," we start with "what entities exist and how are they connected."

```
Author ──wrote──→ Book ──belongs_to──→ Series
                      ├── explores──→ Theme
                      ├── evokes────→ Atmosphere
                      └── set_in───→ Universe
```

When data is stored this way, the graph is not a visualization layer on top of the data. The graph **is** the data. The relational database is only the storage mechanism.

## Relationships Over Fields

The design rule is:

> If two objective facts about the world are connected, they should be stored as entities linked by a relationship, not as a column value on a row.

**Before (primitive fields):**

- `Book.author` — a string with no stable identity
- `Book.author_id` — a FK to the authors table (better, but still one-to-many)
- `Book.themes` — a JSON array of strings with no node identity
- `Book.genres` — a JSON array of strings (duplicated with the many-to-many `book_genres` table)

**After (graph relationships):**

- `Author ──wrote──→ Book` (many-to-many via `book_authors`)
- `Book ──explores──→ Theme` (many-to-many via `book_knowledge_relations`, where Theme is a `KnowledgeNode`)
- `Book ──belongs_to──→ Genre` (many-to-many via `book_genres`)

## How This Differs from Ordinary Library Systems

| Aspect | Traditional Library | Syverro Graph-First |
|---|---|---|
| Primary model | Book record with scalar fields | Graph of entities and relationships |
| Author | Denormalized string or FK | Graph node with `wrote` edges |
| Genre | A field on the book | A node with hierarchy and book edges |
| Theme/Motif | Keyword or tag | `KnowledgeNode` with typed relations |
| Series | String field | Node with `belongs_to` edges |
| User contribution | Ratings, reviews | Subjective graph layer (moods, atmospheres) |
| Querying | WHERE clauses on columns | Traversal of edges (in any direction) |
| Extensibility | Add a new column | Add a new node type or relation type |

## Architectural Principle: Graph First

Every new feature should first answer:

1. **What entities exist?** (What are the nouns?)
2. **What relationship is being created?** (What are the verbs?)

Instead of:

1. **What new table column should we add?**

This is not about technology choice (Neo4j vs PostgreSQL). It is about conceptual modeling. The existing relational database with junction tables, association tables, and the `KnowledgeNode`/`KnowledgeRelation` models already supports graph thinking. The shift is in how we design features.

## Current Graph State

The following entities already have stable identities and relationships:

| Entity | Model | Status |
|---|---|---|
| Book | `models/book.py` | Core hub node |
| Author | `models/author.py` | Full entity with `wrote` edges via `book_authors` |
| Genre | `models/genre.py` | Full entity with hierarchy and `belongs_to` edges |
| KnowledgeNode | `models/knowledge_node.py` | Generic node for themes, motifs, atmospheres, etc. |
| User | `models/user.py` | Identity node; subjective layer via `UserBookExperience` |
| ReadingSession | `models/session.py` | Temporal event node (book ↔ user) |
| Quote | `models/quote.py` | Content node anchored to book and session |

## Legacy Primitive Fields (To Be Migrated)

These fields still exist on `Book` and should eventually become graph relationships:

| Current Field | Should Become |
|---|---|
| `Book.author` (string) | Already migrated to many-to-many; legacy field preserved |
| `Book.genres` (JSON) | Already duplicated in `book_genres` junction; legacy field preserved |
| `Book.themes` (JSON) | `Book ──explores──→ Theme` (KnowledgeNode) |
| `Book.motifs` (JSON) | `Book ──contains──→ Motif` (KnowledgeNode) |
| `Book.series_name` (string) | `Book ──belongs_to──→ Series` (new entity) |
| `Book.original_language` (string) | `Book ──written_in──→ Language` (new entity) |
| `Book.country_of_origin` (string) | `Book ──originates_from──→ Country` (new entity) |
| `Book.publication_type` (string) | `Book ──published_as──→ PublicationType` (new entity) |

## Long-Term Vision

The end state is an interface where a user does not "search for books by filters." Instead, they navigate the graph:

- Start at **Atmosphere: Melancholic** → find books that evoke it → find authors who wrote them → find themes those authors explore → find related books.
- Start at **Concept: Identity** → find books that explore it → find historical events connected to those books → find characters within them.
- Start at a **Character** → find books they appear in → find authors who wrote those books → find universes those books belong to.

Filters become obsolete. The graph **is** the filter.

The administrator's job shifts from editing forms to curating relationships — connecting books to entities, validating AI-proposed links, and maintaining the quality of the graph.

## What This Document Means for Development

1. **No new primitive string/list fields on Book.** Every new piece of metadata about a book must be a relationship to an entity.
2. **New features start with entity identification.** Before writing a migration, identify the entities and relationships involved.
3. **Existing primitive fields should be migrated incrementally.** Each migration creates a new entity model, backfills relationships from the legacy field, and (eventually) drops the column.
4. **The KnowledgeNode/KnowledgeRelation system is the generic escape hatch.** For entity types that don't yet have a dedicated model, KnowledgeNode provides a schema-free node.
5. **UI should gradually evolve from editing records to editing relationships.** The Book Enrichment page is the template: entity sections (Authors, Genres) are already separate. Future sections (Themes, Motifs, Series, Publisher, etc.) should follow the same pattern.
