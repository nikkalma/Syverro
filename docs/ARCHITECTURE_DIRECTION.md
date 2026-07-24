# Syverro — Architecture Direction

## Product Split

Syverro is evolving from a single Expo prototype into two distinct platforms serving different purposes within the same ecosystem.

---

## Syverro Mobile

**Purpose:**
A personal reading experience application.

**Core idea:**
Syverro Mobile is not a library database.
It is an interface for experiencing, tracking, and reflecting on reading.

**Responsibilities:**
- Personal library management
- Reading sessions with timer and page tracking
- Quotes and personal notes
- Reading statistics and patterns
- Personal reading portrait (insights, genre distribution, weekly activity)
- Offline-first local data with silent background sync
- Theme and language preferences

**It should feel like:**
"a reading instrument"

**Not:**
"a book catalog"

**Platform:** Kotlin + Jetpack Compose (Android native)
**Data:** Room SQLite (local source of truth), synced to server
**Design philosophy:** Calm-tech, muted colors, glass surfaces, minimal motion

---

## Syverro Studio

**Purpose:**
A knowledge curation and analytical platform.

**Core idea:**
Studio is not only an admin panel.
It is the intelligence layer of the Syverro ecosystem.

**Responsibilities:**
- Curated book catalog with rich metadata
- Author identity management
- Genre taxonomy (hierarchical)
- Atmosphere taxonomy (emotional/tonal qualities, separate from genre)
- Knowledge graph visualization and editing
- Moderation workflow (draft → review → publish)
- Metadata enrichment and quality control
- Ecosystem analytics (aggregate, anonymized)
- User account management

**It should represent:**
"the portrait of readers and the structure of knowledge"

**Not:**
"just a CMS"

**Platform:** Web (framework to be decided)
**Data:** Server-side relational database, source of truth for catalog
**Users:** Administrators, moderators, editors (not readers)

---

## Data Flow

```
Syverro Studio (Server)
    │
    │  Catalog data (books, authors, genres, atmospheres, series)
    │  Pulled by mobile on sync
    ▼
Syverro Mobile (Device)
    │
    │  Personal data (library, sessions, quotes, profile)
    │  Pushed to server on sync
    ▼
Syverro Studio (Server)
    (receives anonymous aggregate analytics)
```

- The **catalog** is curated in Studio and synced **to** mobile devices.
- **Personal reading data** is created on mobile and synced **to** the server for backup.
- The server never pushes personal data to other devices (privacy by design).
- Sync is silent, asynchronous, and conflict-resolved by timestamp.

---

## Product Evolution

### Phase 1: Expo Prototype (Complete)

**Purpose:**
Validate core UX ideas before committing to native development.

**Validated concepts:**
- Library interaction patterns (grid, search, filter, sort)
- Reading session lifecycle (start, timer, pause, resume, end)
- Visual atmosphere (dark theme, muted colors, glass surfaces)
- Calm-tech principles (no gamification, no notifications)
- Book metadata model (status, rating, genres, dates, notes)
- Profile and statistics (progress ring, genre chart, weekly activity)
- i18n system (Russian, English, Belarusian, Ukrainian)

**Not validated (moved to future phases):**
- Knowledge graph navigation
- Atmosphere taxonomy
- Author pages and discovery
- Sync engine with real server

### Phase 2: Native Rebuild (Current)

**Purpose:**
Create a production-quality mobile experience on Android.

**Key decisions:**
- Full rewrite in Kotlin + Jetpack Compose
- Room database with properly typed entities and migrations
- All session, quote, and profile stubs replaced with real implementations
- Orb background and decorative effects removed
- Auth flows rebuilt with token refresh and biometric options
- Performance target: 60fps at 1000+ books

**Deliverable:** Syverro Mobile V1 on Google Play.

### Phase 3: Studio Expansion (Future)

**Purpose:**
Build the knowledge and analytics layer that powers the ecosystem.

**Key decisions:**
- Web platform (separate from mobile codebase)
- Catalog management with moderation pipeline
- Knowledge graph visualization
- Aggregate analytics across the reader base
- API that mobile and future clients consume

**Deliverable:** Syverro Studio web application.

---

## Technology Stack Summary

| Layer | Phase 1 (Prototype) | Phase 2 (Mobile) | Phase 3 (Studio) |
|-------|--------------------|------------------|-------------------|
| Language | TypeScript | Kotlin | (TBD) |
| UI | React Native / Expo | Jetpack Compose | Web framework |
| State | Zustand | StateFlow / Room | (TBD) |
| Database | expo-sqlite | Room | PostgreSQL |
| Networking | Axios (mock) | Retrofit | (TBD) |
| Auth | AsyncStorage token | EncryptedSharedPreferences | (TBD) |
| Charts | victory-native | Compose Canvas | (TBD) |

---

## Principles That Span All Phases

1. **Offline-first:** Mobile app works fully without internet. Server is backup, not gate.
2. **No gamification:** Streaks, badges, and leaderboards are excluded by design.
3. **Private by default:** Reading data belongs to the user. No social features.
4. **Calm-tech:** The app should feel like a reading lamp, not a slot machine.
5. **Experience over catalog:** The reader's personal journey is the product, not the book list.
6. **Separate objective and subjective:** What a book is (catalog) is managed separately from what it meant to a reader (personal data).
7. **Graph-native thinking:** Books are nodes in a network of ideas, not rows in a spreadsheet.