# Atmosphere Concept

## Definition

Atmosphere is a unique Syverro concept. It is **not** genre, **not** mood, and **not** simple metadata.

Atmosphere describes the emotional and imaginative space created by a book — the felt sense of the world the reader enters.

## What Atmosphere Is Not

| Concept | Question | Example |
|---------|----------|---------|
| Genre | "What category is this?" | Science Fiction |
| Mood | "What emotion did I feel?" | Melancholy |
| Theme | "What ideas does it explore?" | Power, Ecology |
| Motif | "What symbols recur?" | Hero's journey |
| Atmosphere | "What world did I enter?" | Loneliness among stars |

## Core Principle

Atmosphere is a **bridge** between book structure and human perception. It exists at the intersection of:

- The text's language, imagery, pacing, and setting
- The reader's personal imagination, memory, and emotional state

Unlike genre (objective classification) or mood (subjective emotion), atmosphere is a **shared imaginative space** — it describes the world the book creates, not the category it belongs to.

## Atmosphere Examples

### Literature Examples

| Book | Atmosphere | Genre (for comparison) |
|------|-----------|----------------------|
| Dune | Loneliness among stars, ancient forgotten civilization | Science Fiction |
| The Name of the Wind | Warm library at midnight, a story within a story | Fantasy |
| Roadside Picnic | Silence before an unknown event, zone of mystery | Science Fiction |
| The Master and Margarita | Surreal Moscow carnival, the devil's ball | Literary fiction |
| Stalker (film) | Journey through an unknown world, longing for meaning | Science fiction / drama |
| 1984 | Cold concrete and total surveillance, the end of truth | Dystopian fiction |
| The House in the Cerulean Sea | Cozy found family, warm house in a rainy village | Fantasy |
| Blood Meridian | Endless desert, the horror of manifest destiny | Western / Literary |

### Atmosphere Catalog

A growing, non-exhaustive list of atmosphere nodes:

- Loneliness among stars
- Ancient forgotten civilization
- Warm library at midnight
- Silence before an unknown event
- Feeling of the end of an era
- Journey through an unknown world
- Old, creaking house with secrets
- Rain on a quiet street
- Vast empty desert under an indifferent sun
- Cozy village nestled in misty hills
- Bustling spaceport full of languages
- Decaying grandeur of a fallen empire
- Stillness of deep space
- Warm kitchen on a cold winter night
- Mysterious forest where paths shift
- City that never sleeps, neon-lit
- Ancient library filled with forgotten knowledge
- Storm approaching on the horizon
- Quiet morning in a small seaside town
- The weight of history in old stone walls

## Atmosphere as a Knowledge Node

Atmosphere entries are stored as `knowledge_nodes` with type `atmosphere`.

### Fields specific to atmosphere nodes

- `name` — short evocative phrase (e.g., "Loneliness among stars")
- `description` — optional elaboration of the atmosphere
- `parent_id` — optional, for atmosphere families (e.g., "Cozy" → "Warm library at midnight", "Warm kitchen on a cold winter night")
- `metadata` — JSONB for future extensibility

### Who Creates Atmosphere

| Source | Permission | Example |
|--------|-----------|---------|
| Moderator | Create atmosphere nodes | "Loneliness among stars" |
| Admin | Create atmosphere nodes | "Neon-lit city that never sleeps" |
| Owner | Create atmosphere nodes | Any |
| AI | Suggest atmosphere connections | "Dune → loneliness among stars" |
| User | Cannot create nodes, but can create personal atmosphere perceptions | "Dune felt like... to me" |

## User Atmosphere Perception

The reader experience layer includes personal atmosphere:

- A user can describe how they personally experienced the atmosphere of a book
- This is stored separately from the objective atmosphere layer
- Multiple users can perceive the same book differently — all valid

### Personal Atmosphere Fields

- `user_id` — who perceived this
- `book_id` — which book
- `atmosphere_id` — FK to knowledge_nodes with type `atmosphere`
- `notes` — optional text describing the personal experience
- `intensity` — how strongly this atmosphere was felt (0.0–1.0)

## Atmosphere in the UI

### Book Detail Page

- Display assigned atmospheres with descriptions
- Show which atmospheres are "objective" (moderator/admin assigned) vs "community" (user perceptions)
- Allow users to add their own atmosphere perceptions without modifying the objective layer

### Discovery / Search

- Search by atmosphere: "Find books with 'warm library at midnight' atmosphere"
- Atmosphere-based recommendations: "You liked books with this atmosphere, try these"
- Atmosphere wheel: Visual representation of a book's atmospheric profile

### Profile

- User's atmosphere history: "What atmospheres have you traveled through?"
- Atmosphere map: Visual timeline of atmospheres across reading history
