# Knowledge Graph Architecture

## Overview

Syverro's core is a knowledge graph, not a flat catalog. Books are nodes in an intellectual ecosystem, connected through ideas, themes, concepts, domains, atmosphere, and reader experience.

## Why PostgreSQL First

Neo4j is the long-term target, but the graph architecture is first implemented inside PostgreSQL for:

- No additional infrastructure during early development
- Existing async SQLAlchemy stack
- Transactional integrity with existing entities (books, users, sessions)
- Ability to migrate to a dedicated graph database later when scale demands it.

## Core Entities

### KnowledgeNode

A universal graph node representing any classification entity.

**Supported types:**
- `literary_type` — prose, poetry, drama
- `genre` — science fiction, fantasy, detective
- `domain` — philosophy, physics, biology
- `specialization` — quantum mechanics, molecular biology
- `theme` — power, ecology, religion
- `motif` — hero's journey, transformation
- `concept` — artificial intelligence, entropy
- `atmosphere` — loneliness among stars, warm library at midnight
- `mood` — calm, melancholy, inspiration

**Fields:**
- `id` — UUID primary key
- `name` — human-readable label
- `slug` — unique URL-safe identifier
- `node_type` — node type (literary_type, genre, domain, specialization, theme, motif, concept, atmosphere, mood)
- `parent_id` — optional self-referencing FK for hierarchy
- `meta` — JSONB (`metadata` column) for extensible attributes
- `created_at`, `updated_at` — timestamps

### KnowledgeRelation

Connects two KnowledgeNodes with a typed relationship.

**Fields:**
- `id` — UUID primary key
- `source_node_id` — FK to knowledge_nodes
- `target_node_id` — FK to knowledge_nodes
- `relation_type` — string (e.g. `related_to`, `part_of`, `influenced_by`, `similar_to`, `contrasts_with`, `explores`)
- `weight` — float (0.0–1.0), strength of the relation
- `metadata` — JSONB for extensible attributes
- `created_at`, `updated_at` — timestamps

### BookKnowledgeRelation

Connects a book to a KnowledgeNode with source attribution and approval workflow.

**Fields:**
- `id` — UUID primary key
- `book_id` — FK to books
- `node_id` — FK to knowledge_nodes
- `relation_type` — string: `classified_as`, `explores`, `contains`, `evokes`
- `source` — string: `moderator`, `admin`, `owner`, `ai`, `user`
- `status` — string: `proposed`, `approved`, `rejected` (default `proposed`)
- `confidence` — float (0.0–1.0), relevance of the connection
- `created_at` — timestamp

### UserBookExperience

Personal reader experience layer. Private by default.

**Fields:**
- `id` — UUID primary key
- `user_id` — FK to users
- `book_id` — FK to books
- `atmosphere_node_id` — nullable FK to knowledge_nodes (type: atmosphere)
- `mood_node_id` — nullable FK to knowledge_nodes (type: mood)
- `intensity` — float (0.0–1.0)
- `note` — optional text
- `created_at` — timestamp

## Database Tables

```sql
-- Knowledge Graph nodes
CREATE TABLE knowledge_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    slug VARCHAR NOT NULL,
    node_type VARCHAR NOT NULL,  -- literary_type | genre | domain | specialization | theme | motif | concept | atmosphere | mood
    parent_id UUID REFERENCES knowledge_nodes(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(slug)
);

CREATE INDEX ix_knowledge_nodes_node_type ON knowledge_nodes(node_type);
CREATE INDEX ix_knowledge_nodes_parent_id ON knowledge_nodes(parent_id);

-- Relations between knowledge nodes
CREATE TABLE knowledge_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    relation_type VARCHAR NOT NULL,  -- related_to, part_of, influenced_by, similar_to, contrasts_with, explores
    weight FLOAT DEFAULT 0.5,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(source_node_id, target_node_id, relation_type)
);

CREATE INDEX ix_knowledge_relations_source_node_id ON knowledge_relations(source_node_id);
CREATE INDEX ix_knowledge_relations_target_node_id ON knowledge_relations(target_node_id);
CREATE INDEX ix_knowledge_relations_relation_type ON knowledge_relations(relation_type);

-- Relations between books and knowledge nodes (with approval workflow)
CREATE TABLE book_knowledge_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    relation_type VARCHAR NOT NULL,  -- classified_as, explores, contains, evokes
    source VARCHAR NOT NULL,  -- moderator | admin | owner | ai | user
    status VARCHAR DEFAULT 'proposed',  -- proposed | approved | rejected
    confidence FLOAT DEFAULT 0.5,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(book_id, node_id, relation_type, source)
);

CREATE INDEX ix_book_knowledge_relations_book_id ON book_knowledge_relations(book_id);
CREATE INDEX ix_book_knowledge_relations_node_id ON book_knowledge_relations(node_id);
CREATE INDEX ix_book_knowledge_relations_status ON book_knowledge_relations(status);

-- Personal reader experience layer (private)
CREATE TABLE user_book_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    atmosphere_node_id UUID REFERENCES knowledge_nodes(id) ON DELETE SET NULL,
    mood_node_id UUID REFERENCES knowledge_nodes(id) ON DELETE SET NULL,
    intensity FLOAT DEFAULT 0.5,
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, book_id, atmosphere_node_id)
);

CREATE INDEX ix_user_book_experiences_user_id ON user_book_experiences(user_id);
CREATE INDEX ix_user_book_experiences_book_id ON user_book_experiences(book_id);
```

## Migration Path

### Phase 1 — PostgreSQL Graph (current target)

Implement `knowledge_nodes`, `knowledge_relations`, and `book_knowledge_relations` tables within the existing PostgreSQL schema. This provides:

- Full graph query capability via recursive CTEs
- Transactional integrity with books, users, and sessions
- No additional infrastructure

### Phase 2 — Graph Query Layer

Build a query layer that uses recursive CTEs to traverse the graph:

```sql
-- Example: Find all books related to a concept through graph traversal
WITH RECURSIVE related_nodes AS (
    SELECT id, name, type, 0 AS depth
    FROM knowledge_nodes
    WHERE slug = 'power'
    UNION ALL
    SELECT kn.id, kn.name, kn.type, rn.depth + 1
    FROM knowledge_nodes kn
    JOIN knowledge_relations kr ON kr.target_id = kn.id
    JOIN related_nodes rn ON rn.id = kr.source_id
    WHERE rn.depth < 3
)
SELECT DISTINCT b.id, b.title
FROM books b
JOIN book_knowledge_relations bkr ON bkr.book_id = b.id
WHERE bkr.node_id IN (SELECT id FROM related_nodes);
```

### Phase 3 — Graph Database (Future)

When the graph grows beyond PostgreSQL's recursive CTE performance, migrate to Neo4j or similar. The entity model is designed to map cleanly:

- `KnowledgeNode` → Neo4j node with labels by `type`
- `KnowledgeRelation` → Neo4j relationship with `relation_type` property
- `BookKnowledgeRelation` → Neo4j relationship from Book node to KnowledgeNode

## Current State vs Target

| Aspect | Current (Genre-based) | Target (Knowledge Graph) |
|--------|----------------------|--------------------------|
| Classification | Flat genre list | Typed nodes (theme, motif, domain, etc.) |
| Relations | None between genres | Typed, weighted relations between nodes |
| Book connections | Many-to-many genres | Many-to-many typed nodes with source attribution |
| Admin focus | Genre CRUD | Full knowledge graph management |
| User role | Can add genres | Contributes only experience layer |

## Migration Strategy

1. Create `knowledge_nodes`, `knowledge_relations`, `book_knowledge_relations` tables
2. Migrate existing `Genre` data into `knowledge_nodes` with type `genre`
3. Migrate existing `themes` and `motifs` JSON arrays from books into `book_knowledge_relations`
4. Keep `Genre` table for backward compatibility during transition
5. Add admin API endpoints for knowledge graph management
6. Deprecate `Genre` table once migration is complete
