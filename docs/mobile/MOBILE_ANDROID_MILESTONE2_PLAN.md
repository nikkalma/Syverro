# Syverro Mobile V1 — Milestone 2 Pre-Implementation Report

## Current State

The Android project is a greenfield Kotlin + Jetpack Compose app with:

- 4-tab bottom navigation (Home, Library, Session, Profile)
- Material 3 dark/light theme (dark matches DESIGN_SYSTEM.md, light deviates)
- Spacing system matching the 4pt grid
- Hilt scaffolding (annotations on Application + Activity, kapt configured)
- Screen stubs with empty ViewModels returning default UiStates
- Empty `data/`, `domain/`, `di/` packages

Build cannot be verified — no JDK on the development machine.

## Files to Create

```
domain/
└── model/
    ├── Book.kt               # id, title, author, coverRef, readingStatus enum
    ├── ReadingSession.kt     # id, bookId, startTime, duration, status enum
    ├── Quote.kt              # id, sessionId, text, createdAt
    └── UserProfile.kt        # name, booksRead, totalReadingTime

domain/
└── repository/
    ├── BookRepository.kt     # interface: getAll, getById, updateStatus, startReading
    ├── SessionRepository.kt  # interface: getActive, getAllForBook, create, update, addQuote
    └── ProfileRepository.kt  # interface: getProfile, getInsight

data/
└── repository/
    ├── InMemoryBookRepository.kt
    ├── InMemorySessionRepository.kt
    └── InMemoryProfileRepository.kt

di/
└── RepositoryModule.kt      # Hilt @Module providing in-memory implementations

presentation/
├── home/
│   └── HomeEvent.kt         # sealed interface for Home actions
├── library/
│   └── LibraryEvent.kt      # sealed interface for Library actions
├── session/
│   └── SessionEvent.kt      # sealed interface for Session actions
├── profile/
│   └── ProfileEvent.kt      # sealed interface for Profile actions
├── bookdetail/
│   ├── BookDetailScreen.kt
│   ├── BookDetailViewModel.kt
│   └── BookDetailUiState.kt
└── settings/
    ├── SettingsScreen.kt
    ├── SettingsViewModel.kt
    └── SettingsUiState.kt
```

## Files to Modify

```
presentation/home/HomeScreen.kt        # Replace empty state stub with active book card UI
presentation/home/HomeViewModel.kt     # Inject BookRepository + SessionRepository
presentation/home/HomeUiState.kt       # Add lastSession, readingSince fields

presentation/library/LibraryScreen.kt   # Replace empty stub with 3-column book grid + chips
presentation/library/LibraryViewModel.kt # Inject BookRepository
presentation/library/LibraryUiState.kt  # Add book list with domain types

presentation/session/SessionScreen.kt   # Timer, start/pause/finish, quote capture bottom sheet
presentation/session/SessionViewModel.kt # Inject repos, coroutine ticker, elapsedRealtime
presentation/session/SessionUiState.kt   # Timer display fields, session state

presentation/profile/ProfileScreen.kt   # Natural language insight + stats + settings gear
presentation/profile/ProfileViewModel.kt # Inject ProfileRepository + SessionRepository
presentation/profile/ProfileUiState.kt  # Add insight text, stats fields

ui/navigation/SyverroNavGraph.kt       # Add bookDetail/{id} + settings routes
```

## Architecture Changes

| Layer | Before | After |
|-------|--------|-------|
| domain/model | Empty | 4 model classes with enums |
| domain/repository | Empty | 3 repository interfaces |
| data/repository | Empty | 3 in-memory implementations |
| di | Empty | 1 Hilt module |
| presentation/* | Empty ViewModels, empty UiState stubs | Real ViewModels with injected repos, rich UiStates with event handling |
| navigation | 4 routes | 6 routes (+ bookDetail/{id}, + settings) |

### Key Architecture Decisions

1. **Repository pattern**: ViewModels never touch data directly. They call repository interfaces. The in-memory implementations are replaceable by Room without changing ViewModels.

2. **Event-driven ViewModels**: Each screen has a sealed `Event` interface + `onEvent(event)` function. This keeps UI logic in one place and makes testing straightforward.

3. **Clock abstraction for timer**: The Session timer uses `SystemClock.elapsedRealtime()` via a `Clock` interface so the timer logic is testable.

4. **Active book derivation**: The "active book" is the book associated with the most recent session in `IN_PROGRESS` status. No separate active-book concept.

5. **Single Activity architecture**: `MainActivity` hosts all navigation. No fragment-based approach.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| No JDK to verify build | Cannot confirm compilation | Report build status as untested; list JDK as blocker |
| In-memory state lost on process death | Data loss during development | Acceptable — Room milestone follows immediately |
| Timer drift if process is suspended | Inaccurate session duration | Use `SystemClock.elapsedRealtime()` which survives short suspensions |
| Light theme colors deviate from DESIGN_SYSTEM.md | Visual inconsistency | Document existing deviation; do not change colors in this milestone |

## Dependencies Required

No new Gradle dependencies. The existing setup (Compose, Hilt, Navigation, Material3) is sufficient for all features in this milestone. Room, Retrofit, DataStore, and serialization libraries will come in later milestones.

## Implementation Order

1. Domain models (Book, ReadingSession, Quote, UserProfile)
2. Repository interfaces
3. In-memory repository implementations with seed data
4. Hilt DI module
5. Home screen (ViewModel + UiState + Screen + Events)
6. Library screen (ViewModel + UiState + Screen + Events)
7. BookDetail screen (ViewModel + UiState + Screen)
8. Session screen (ViewModel + UiState + Screen + Events + timer)
9. Profile screen (ViewModel + UiState + Screen + Events)
10. Settings screen (ViewModel + UiState + Screen)
11. Navigation updates (add detail routes)
12. Post-implementation report