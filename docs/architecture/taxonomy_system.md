# Taxonomy System

## Purpose

The taxonomy engine is the backbone of Syverro's knowledge graph. It defines how books are classified, how nodes relate to each other, and how the system evolves from a flat genre list to a rich, multi-dimensional taxonomy.

## Taxonomy Layers

### Layer 1: Literary Type

The broadest classification. Defines the fundamental form of the work.

- `prose` — novels, novellas, short stories
- `poetry` — verse, epic poems, haiku
- `drama` — plays, screenplays

### Layer 2: Genre

Traditional genre classification. These map to the existing `Genre` model and will be migrated into `knowledge_nodes` with type `genre`.

- Fiction: fantasy, science fiction, detective, horror, historical fiction, romance
- Non-fiction: science, philosophy, history, biography, psychology, economics, business
- Spiritual: esotericism, tarot, astrology, meditation, theology
- Cultural: mythology, folklore, epics
- Practical: cooking, travel, art, music

### Layer 3: Domain

Broad knowledge domains the book engages with.

- Philosophy, Physics, Biology, Psychology, Sociology, Economics, History, Linguistics, Computer Science, etc.

### Layer 4: Specialization

Sub-fields within a domain.

- Quantum Mechanics (domain: Physics)
- Molecular Biology (domain: Biology)
- Cognitive Psychology (domain: Psychology)

### Layer 5: Theme

Recurring thematic concerns of the book.

- Power, Ecology, Religion, Identity, Freedom, Justice, Love, Death, Technology, Nature

### Layer 6: Motif

Recurring structural or symbolic elements.

- Hero's journey, Transformation, The double, The quest, Coming of age, Redemption, Sacrifice

### Layer 7: Concept

Abstract ideas the book engages with.

- Artificial intelligence, Free will, Entropy, The sublime, The uncanny, The simulacrum

## Node Type Hierarchy

```
literary_type
  └── prose, poetry, drama

genre
  └── fantasy, science_fiction, detective, horror, romance, historical_fiction
  └── non-fiction: philosophy, science, history, biography, psychology

domain
  └── philosophy, physics, biology, psychology, sociology, economics, history, linguistics

specialization
  └── quantum_mechanics (domain: physics)
  └── molecular_biology (domain: biology)
  └── cognitive_psychology (domain: psychology)

theme
  └── power, ecology, religion, identity, freedom, justice, love, death, technology, nature

motif
  └── hero_journey, transformation, the_double, the_quest, coming_of_age, redemption, sacrifice

concept
  └── artificial_intelligence, free_will, entropy, the_sublime, the_uncanny, the_simulacrum

atmosphere
  └── loneliness_among_stars, ancient_forgotten_civilization, warm_library_at_midnight

mood
  └── calm, melancholy, inspiration, anxiety, curiosity, admiration, hope
```

## Taxonomy Engine Design

### Node Creation Rules

1. **Slug generation**: Auto-generated from name (lowercased, non-alphanumeric replaced with hyphens)
2. **Uniqueness**: Slug must be unique across all nodes (global namespace)
3. **Parent hierarchy**: Optional self-referencing parent_id for hierarchical taxonomies (e.g., genre trees)
4. **Type constraint**: Each node has exactly one type, enforced at application level

### Relation Types

| Relation Type | Description | Example |
|--------------|-------------|---------|
| `related_to` | General association | Science Fiction ↔ Philosophy |
| `explores` | A book or theme investigates a concept | Dune → Power |
| `contrasts_with` | Opposition or tension | AI ↔ Human Nature |
| `influences` | One concept influenced another | Nietzsche → Existentialism |
| `precedes` | Temporal ordering | Romanticism → Modernism |
| `belongs_to` | Hierarchical membership | Quantum Mechanics → Physics |
| `exemplifies` | A book exemplifies a theme | 1984 → Totalitarianism |

## Taxonomy Engine Rules

### Node Creation

1. **Slug uniqueness**: All slugs are globally unique across all node types
2. **Type immutability**: Once created, a node's type cannot change
3. **Parent constraint**: Parent must be of a compatible type (e.g., specialization parent must be a domain)
4. **No duplicate names**: Case-insensitive unique constraint on name within the same type

### Relation Rules

1. **No self-relations**: source_id and target_id must differ
2. **No duplicate typed relations**: Only one relation of a given type between any two nodes
3. **Weight range**: 0.0 (weak) to 1.0 (strong), default 0.5
4. **Bidirectional**: Relations are directional but queries should consider both directions

### Book Connection Rules

1. **Source attribution**: Every book-node connection must record its source (moderator, admin, owner, ai, user)
2. **No user classification**: Users do not manually classify books. They contribute only to the reader experience layer
3. **AI suggestions**: AI-generated connections are tagged with `source: ai` and require moderator/admin confirmation
4. **Weight decay**: AI-suggested connections start at lower weight and increase upon confirmation

## Admin Management

The admin panel transitions from "Genre management" to "Knowledge Graph management":

- **Nodes**: CRUD for all node types (literary_type, genre, domain, specialization, theme, motif, concept, atmosphere, mood)
- **Relations**: Create, view, and manage typed relations between nodes
- **Book connections**: Connect books to nodes with source attribution
- **AI suggestions**: Review and confirm/reject AI-generated connections
- **Graph visualization**: Visual representation of the knowledge graph (future)

## API Endpoints (Implemented)

`
# Public Taxonomy API
GET    /taxonomy/nodes                      - List nodes (filterable by type, search, parent_id)
GET    /taxonomy/nodes/{id}                 - Get single node
GET    /taxonomy/nodes/{id}/relations       - Get node relations (both directions)
GET    /taxonomy/books/{book_id}/nodes      - Get book knowledge graph (approved only)

# Admin Taxonomy API (requires admin/moderator role)
POST   /admin/taxonomy/nodes                - Create knowledge node
PUT    /admin/taxonomy/nodes/{node_id}      - Update knowledge node
DELETE /admin/taxonomy/nodes/{node_id}      - Delete knowledge node (owner only)

POST   /admin/taxonomy/relations            - Create relation between nodes
DELETE /admin/taxonomy/relations/{id}       - Delete relation

POST   /admin/books/{book_id}/taxonomy      - Connect book to node (moderator+)
PUT    /admin/books/{book_id}/taxonomy/{id} - Update book-node relation (approve/reject)
GET    /admin/books/{book_id}/taxonomy      - List book relations (with status filter)
DELETE /admin/books/{book_id}/taxonomy/{id} - Delete book-node relation
`
