# Milestone 3 — Room Persistence Report

## Objective

Replace in-memory session and profile storage with Room-backed persistence so that all user data survives application restart.

## Files Created

| File | Purpose |
|------|---------|
| `data/local/entity/SessionEntity.kt` | Room entity for reading sessions. Fields: id (auto-generated Long), bookId (String FK → books), startedAt, finishedAt (nullable), durationSeconds, status, createdAt |
| `data/local/entity/QuoteEntity.kt` | Room entity for captured quotes. Fields: id (auto-generated Long), sessionId (Long FK → sessions), bookId (String), text, createdAt |
| `data/local/entity/UserProfileEntity.kt` | Room entity for user profile. Fields: id (String PK, fixed "default"), displayName, createdAt, updatedAt |
| `data/local/dao/SessionDao.kt` | DAO with queries: getActiveSession, getSessions, getSessionsByBook, getSessionById, insertSession (returns Long id), updateSession, deleteSession |
| `data/local/dao/QuoteDao.kt` | DAO with queries: getQuotes, getQuotesBySession, insertQuote (returns Long id), deleteQuote |
| `data/local/dao/ProfileDao.kt` | DAO with queries: getProfile, saveProfile |
| `data/repository/RoomSessionRepository.kt` | Room-backed SessionRepository. Creates sessions with wall-clock timestamps, persists duration/status, saves quotes with session-bok linkage |
| `data/repository/RoomProfileRepository.kt` | Room-backed ProfileRepository. Persists display name to user_profile table |

## Files Modified

| File | Change |
|------|--------|
| `data/local/database/SyverroDatabase.kt` | Added SessionEntity, QuoteEntity, UserProfileEntity; version 1→2; MIGRATION_1_2 creates 3 new tables + indexes + default profile; exposes sessionDao(), quoteDao(), profileDao() |
| `di/DatabaseModule.kt` | Added MIGRATION_1_2 to database builder; provides SessionDao, QuoteDao, ProfileDao |
| `di/RepositoryModule.kt` | Replaced InMemorySessionRepository → RoomSessionRepository; Replaced InMemoryProfileRepository → RoomProfileRepository |
| `data/repository/InMemoryBookRepository.kt` | Fixed pre-existing compilation errors (missing interface methods + wrong Book constructor args) to unblock build |
| `presentation/profile/ProfileViewModel.kt` | Removed InMemoryProfileRepository type-cast dependency; computes insight and totalReadingTimeSeconds from repositories directly |

## Database Version

**Version 2** (migration from 1 via `MIGRATION_1_2`)

Migration creates three new tables (non-destructive — existing books/user_books data preserved):

- `sessions` — reading session records
- `quotes` — captured quotes linked to sessions
- `user_profile` — single-row profile table

## Persistence Status

| Data | Before | After |
|------|--------|-------|
| Book catalog | Room (persisted) | Room (persisted) — unchanged |
| User book metadata | Room (persisted) | Room (persisted) — unchanged |
| Reading sessions | InMemory (lost on restart) | **Room (persisted)** |
| Session quotes | InMemory (lost on restart) | **Room (persisted)** |
| Profile name | InMemory (lost on restart) | **Room (persisted)** |
| Reading stats | Computed from in-memory state | Computed from Room sessions |

## Build Result

```
./gradlew assembleDebug → BUILD SUCCESSFUL in 1m 14s
```

Two pre-existing deprecation warnings only (LibraryBooks icon — not related to this milestone).

## Remaining Technical Debt

1. **QuoteEntity.bokId is write-only.** The field exists in the entity and is populated from the parent session, but there is no `getQuotesByBook` query in the UI yet. This enables future "all quotes across sessions for a book" features without schema changes.

2. **No migration for existing in-memory data.** Users who had active sessions or profile data in the old in-memory implementation will lose that data on upgrade. This is acceptable since the app is in development and no production users exist.

3. **ProfileDao is single-row by convention.** `getProfile()` always operates on `id = 'default'`. This works for a single-user app but would need expansion for multi-profile support.

4. **`generateInsight` logic moved to ViewModel.** Previously housed in `InMemoryProfileRepository`, the insight generation now lives in `ProfileViewModel` as a private method. This is a slight increase in ViewModel responsibility but avoids storing computed insight in the database.

5. **`InMemoryBookRepository` is still present but not bound in DI.** It was fixed only to compile. It remains dead code and could be removed in a future cleanup pass.