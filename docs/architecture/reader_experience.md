# Reader Experience Layer

## Overview

The reader experience layer is the **personal, subjective** layer of Syverro. While the objective knowledge layer (genres, themes, motifs, atmosphere) is curated by moderators, admins, and AI, the reader experience layer belongs entirely to the user.

**Core principle:** One book. Many experiences. All valid.

## What the Reader Contributes

### Reading Sessions

Time-bound reading activity records.

Current model: `ReadingSession`
- start_page, end_page, pages_read
- duration_seconds
- start_time, end_time, date
- status (completed, in_progress)

**Future enhancements:**
- Reading speed tracking across sessions
- Session notes (what was happening in the reader's life during this reading)
- Environment context (where were they reading? home, commute, café)
- Session mood (how did they feel during this session?)

### Notes and Reflections

Free-form text associated with a book.

Current model: Stored in `UserBook.notes` (single text field)

**Future model:**
- Per-session notes instead of per-book notes
- Structured reflections: What did this chapter make me think about?
- Labeled notes: insight, question, connection, summary
- Note connections: link notes to themes, concepts, or atmosphere nodes

### Quotes

Highlighted passages from the book.

Current model: `Quote`
- text (required), page (optional)
- note (optional), session_id (optional)
- session_time_minutes (optional)

**Future enhancements:**
- Quote collections / lists
- Quote connections to knowledge nodes (what theme does this quote illustrate?)
- Quote sharing (with attribution)
- Quote mood tags

### Insights

Personal discoveries and realizations while reading.

**Not yet implemented — planned model:**
- `insight_id` — UUID
- `book_id` — FK to books
- `user_id` — FK to users
- `text` — the insight
- `source` — which session, quote, or note triggered it
- `connections` — links to knowledge nodes (themes, concepts, atmosphere)
- `created_at`, `updated_at`

### Emotions

Emotional response tracking.

**Not yet implemented — planned model:**
- `emotion_id` — UUID
- `book_id` — FK to books
- `user_id` — FK to users
- `emotion_type` — joy, sadness, anger, surprise, fear, disgust, anticipation, trust, curiosity, inspiration, nostalgia, wonder
- `intensity` — 0.0–1.0
- `context` — which chapter, scene, or quote evoked the emotion
- `session_id` — optional FK to reading session
- `created_at`

### Personal Atmosphere Perception

How the user personally experienced the atmosphere of a book.

**Planned model:**
- `user_atmosphere_id` — UUID
- `user_id` — FK to users
- `book_id` — FK to books
- `atmosphere_id` — FK to knowledge_nodes (type: atmosphere)
- `notes` — personal description
- `intensity` — 0.0–1.0
- `created_at`

This is distinct from the objective atmosphere layer. The objective layer says "Dune has atmosphere: loneliness among stars." The user layer says "Dune felt like ancient forgotten civilization to me."

## User-Created Connections

Users can create personal connections between books, ideas, and concepts. These are private unless shared.

**Planned model:**
- `user_knowledge_relation` — private, user-owned relations between books and nodes
- Scope: user-specific, not shared in the global knowledge graph
- Optional: user can choose to share a connection publicly (becomes moderator-reviewable)

## Separation of Concerns

| Layer | Managed By | Visibility | Purpose |
|-------|-----------|------------|---------|
| Objective knowledge | Moderators, admins, AI | Global | "What the book is about" |
| Atmosphere (objective) | Moderators, admins, AI | Global | "What world the book creates" |
| Reader experience | User | Private (user only) | "What the book meant to me" |
| Personal atmosphere | User | Private (user only) | "How the book felt to me" |
| Shared insights | User (opt-in) | Public if shared | "What I discovered" |

## Current vs Target State

### Currently Implemented

| Feature | Model | Status |
|---------|-------|--------|
| Reading sessions | `ReadingSession` | Working |
| Quotes | `Quote` | Working |
| Book notes | `UserBook.notes` | Working (single text field) |
| Book status | `UserBook.status` | Working |
| Rating | `UserBook.rating` | Working |
| Favorite | `UserBook.is_favorite` | Working |

### Planned

| Feature | Status |
|---------|--------|
| Structured per-session notes | Not implemented |
| Labeled notes (insight, question, connection, summary) | Not implemented |
| Note-to-knowledge-node connections | Not implemented |
| Quote collections / mood tags | Not implemented |
| Quote-to-knowledge-node connections | Not implemented |
| Insights engine | Not implemented |
| Emotion tracking | Not implemented |
| Personal atmosphere perception | Not implemented |
| User-created book-to-book relations | Not implemented |
| Reading environment context | Not implemented |
| Reading history timeline | Not implemented |
| Experience export / journal | Not implemented |

## API Endpoints (Planned for Reader Experience)

```
GET    /me/sessions          — My reading sessions
POST   /me/sessions          — Create session
PUT    /me/sessions/{id}     — Update session

GET    /me/quotes            — My quotes
POST   /me/quotes            — Create quote
PUT    /me/quotes/{id}       — Update quote
DELETE /me/quotes/{id}       — Delete quote

GET    /me/insights          — My insights
POST   /me/insights          — Create insight
PUT    /me/insights/{id}     — Update insight
DELETE /me/insights/{id}     — Delete insight

GET    /me/emotions          — My emotional timeline
POST   /me/emotions          — Log an emotion

GET    /me/atmospheres       — My personal atmosphere perceptions
POST   /me/atmospheres       — Add personal atmosphere

GET    /me/connections       — My personal book-knowledge connections
POST   /me/connections       — Create personal connection
DELETE /me/connections/{id}  — Remove personal connection
```

## Design Principles

1. **User is not a librarian** — Users should never be asked to classify books. Classification is the system's job.

2. **Experience is the contribution** — The user's primary contribution is their reading experience: what they felt, thought, and discovered.

3. **Private by default** — All reader experience data is private. Sharing is opt-in.

4. **One book, many truths** — Two users can have completely different experiences of the same book. Both are valid.

5. **Connections over collections** — Instead of organizing books into shelves, users trace the connections between ideas across their reading journey.

6. **The graph grows with the reader** — As the user reads more and adds more experiences, their personal knowledge graph becomes a map of their intellectual journey.
