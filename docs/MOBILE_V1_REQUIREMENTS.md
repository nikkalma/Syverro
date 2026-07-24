# Syverro Mobile V1 — Requirements

## 1. Product Goal

Syverro is a personal reading tracker that treats reading as a process, not a checklist. It lets users maintain a private library of books they have read, are reading, or plan to read; log timed reading sessions with page tracking; capture quotes and thoughts; and gain insight into their reading patterns — all without gamification, social features, or algorithmic recommendations.

The application is a native Android app built with Kotlin and Jetpack Compose. It replaces an Expo prototype. All functionality must work offline. Synchronization with a server is secondary and silent.

---

## 2. Core User Flows

### Flow A: First Launch → Library
1. User installs and opens the app
2. Auth screen appears (email + password)
3. User registers or logs in
4. Empty library screen appears with onboarding hint
5. User adds their first book (title required, author optional)
6. Book appears in the library grid

### Flow B: Start Reading → Log Session
1. User navigates to a book detail
2. Sets book status to "reading"
3. Goes to Sessions tab
4. Selects the book from a horizontal picker
5. Confirms start page (pre-filled from book's current page)
6. Taps "Start session" — timer begins
7. Reads. Can pause/resume. Can capture quotes mid-session.
8. Enters end page, taps "End session"
9. Session is saved. Book's current page updates. Statistics recalculate.

### Flow C: Review Reading Activity
1. User navigates to Profile tab
2. Sees: total books, finished books, completion percentage
3. Sees: top 3 genres by book count
4. Sees: weekly activity chart (reading time per weekday)
5. Sees: auto-generated observations (insights like "You read most on Tuesdays")

### Flow D: Manage Library
1. User opens Library tab
2. Books displayed in a 3-column grid with covers
3. User can search by title, author, or genre
4. User can filter by reading status
5. User can sort by date, title, author, rating, or progress
6. User taps a book to view/edit its full metadata
7. User can add new books, edit existing ones, or delete them

### Flow E: Export Data
1. User opens Settings tab
2. Taps "Export library"
3. JSON file is generated containing all books, sessions, and quotes
4. System share sheet opens — user saves or sends the file

---

## 3. Required Screens

### 3.1 AuthScreen

**Purpose:** Gate access to the app. Identify the user for sync.

**User actions:**
- Enter email
- Enter password
- Toggle between login and registration mode
- Submit form

**Required data:** Token from server upon successful authentication.

**Empty state:** Clean form with email/password fields on first launch.

### 3.2 LibraryScreen

**Purpose:** Primary content surface. Browse, search, filter, sort, and manage books.

**User actions:**
- Scroll the 3-column grid of book cards
- Tap a book card → open BookDetailsScreen
- Tap search icon → expand search bar, filter by text
- Tap filter icon → status filter modal
- Tap sort icon → sort option modal
- Tap + button → add book modal
- Tap favorite toggle on any card

**Required data:** All books from local database. Each card shows cover, title, author, rating.

**Empty state:** "Library is empty. Tap + to add" with a visual hint.

### 3.3 BookDetailsScreen

**Purpose:** View and edit all metadata for a single book.

**User actions:**
- Read book information (view mode)
- Tap edit → switch to edit mode
- Edit: title, author, status, rating, genres, languages, pages, dates, cover image, series info, notes, review
- Save changes
- Set as active book
- Delete book (confirmation required)
- Navigate back

**Required data:** Full Book object: id, title, author, status, rating, cover, genres, languages, totalPages, currentPage, startDate, endDate, notes, review, readingFormat, favorite, series, seriesPosition, authorCountry, originalYear, createdAt, lastRead.

**Empty state:** "Book not found" — should never appear under normal operation.

### 3.4 SessionScreen

**Purpose:** Start, monitor, and complete a timed reading session.

**User actions:**
- Select a book from horizontal scroll (only books with status "reading")
- Confirm start page
- Tap "Start session" → timer begins
- Pause / resume the timer
- Capture a quote mid-session (text, optional page, optional comment)
- Enter end page
- Tap "End session" → session saved, book progress updated
- View session history (last 10 sessions for selected book)
- Delete individual sessions
- Clear all sessions for a book

**Required data:** Selected book, start page (pre-filled from book.currentPage).

**Empty state (no eligible books):** "No books in progress. Add books and mark them as 'reading'."

**Empty state (no sessions yet):** "No reading sessions recorded yet."

### 3.5 HomeScreen (Dashboard)

**Purpose:** Show the current reading status at a glance.

**User actions:**
- View the active book (highlighted with glow border)
- Tap active book → BookDetailsScreen
- Scroll horizontally through other "reading" books
- Tap any reading book → BookDetailsScreen
- View total book count

**Required data:** Active book (the one the user last read from, or the first with status "reading").

**Empty state:** "No books in progress. Add books in Library."

### 3.6 ProfileScreen

**Purpose:** Aggregate reading statistics and personal information.

**User actions:**
- View/edit avatar (emoji picker)
- View/edit display name
- See total books, finished books, completion percentage
- See top 3 genres chart
- See weekly activity chart
- Read auto-generated observations

**Required data:** All books, all sessions. Computed statistics: totalBooks, finishedBooks, completionPercentage, topGenres (count), weekdayActivity (seconds per day), totalHours, averageSpeed.

**Empty state:** Default avatar, "Reader" name, zeroed stats, "Add your first book" prompt.

### 3.7 QuotesScreen

**Purpose:** Browse and manage all captured quotes.

**User actions:**
- Read quotes in a scrollable list
- Filter by book (horizontal chip selector)
- Search by quote text
- Edit the comment on a quote
- Delete a quote (confirmation required)

**Required data:** All quotes from local database. Each quote shows: text, book title, date, page number (if set), reading time at capture (if set), comment (if set).

**Empty state:** "No quotes yet. Capture a quote during a reading session."

### 3.8 SettingsScreen

**Purpose:** Configure preferences and manage data.

**User actions:**
- Toggle theme: Light / Dark / System
- Change language: Russian / English / Belarusian / Ukrainian
- Export library to JSON file
- Reset reading statistics (destructive, two-step confirmation)
- Navigate to About screen

**Required data:** Preferences from local storage (theme mode, language code).

### 3.9 AboutScreen

**Purpose:** Communicate the app's philosophy and version.

**User actions:**
- Read the app description and philosophy text
- Contact developer via email
- Share the app

**Required data:** App version (hardcoded or from build config).

---

## 4. MVP Features

These are the features that must be implemented for the V1 release.

| # | Feature | Priority |
|---|---------|----------|
| 1 | Email + password authentication (register, login, logout) | P0 |
| 2 | Local SQLite database for all entities | P0 |
| 3 | Library: add, edit, delete, list books with grid layout | P0 |
| 4 | Book detail view with full metadata display and editing | P0 |
| 5 | Reading session: start, timer, pause, resume, end | P0 |
| 6 | Session history per book | P0 |
| 7 | Automatic statistics (pages read, time spent, completion %) | P0 |
| 8 | Quote capture during session | P0 |
| 9 | Quotes list with search and book filter | P0 |
| 10 | Dark / Light / System theme toggle | P0 |
| 11 | Multi-language support (Russian, English, Belarusian, Ukrainian) | P0 |
| 12 | Book status management (planned → reading → finished, etc.) | P0 |
| 13 | Search, filter by status, sort in Library | P0 |
| 14 | Favorites toggle on books | P0 |
| 15 | Export library to JSON file | P0 |
| 16 | Profile screen with statistics and charts | P0 |
| 17 | Dashboard (Home) with active book and reading-in-progress | P0 |
| 18 | Three visual atmosphere layers (orbs, glass surfaces, lighting tint) | P0 |
| 19 | Calm-tech design system (muted colors, 4px grid, frosted glass) | P0 |

---

## 5. Features Explicitly Postponed

These are not part of V1.

| Feature | Reason |
|---------|--------|
| EPUB reader | Out of scope. Syverro tracks books read elsewhere. |
| Audiobook session support | Requires different session model (no pages, chapter markers). Post-MVP. |
| Knowledge graph navigation | Complex traversal UI. Requires author, genre, atmosphere entities to be fully modeled. |
| Author pages | Part of knowledge graph. Postponed. |
| Atmosphere taxonomy | Requires curated data and UI. Postponed. |
| Bulk import (CSV, Goodreads) | Not needed for initial adoption. Post-MVP. |
| Sync with server | Requires backend. MVP is fully offline. Sync added in later milestone. |
| Biometric unlock | Convenience feature. Post-MVP. |
| Push notifications | Prohibited by calm-tech principle. |
| Gamification (streaks, badges) | Prohibited by product decision. |
| Social features (share, compare, leaderboards) | Prohibited by product decision. |
| Recommendations or algorithmic discovery | Prohibited by product decision. |
| Data import from prototype | Only if schema is identical. Likely requires migration tool. |

---

## 6. Non-Functional Requirements

### 6.1 Offline-First

- The app must launch and function fully without network connectivity.
- All data (books, sessions, quotes, settings) is stored in local SQLite.
- The local database is the single source of truth.
- The server (when added) is a backup and sync target only.
- No operation should block waiting for network.
- No "no internet" error states in core flows.

### 6.2 Performance

- Library grid of 1000+ books must scroll at 60 fps.
- Session timer must be accurate to within 1 second over a 3-hour session.
- App cold start must show the UI within 2 seconds on a mid-range device (2022).
- Database queries on the books table (10,000 rows) must complete in under 50ms.
- No visible jank during screen transitions.

### 6.3 Accessibility

- All interactive elements must have a minimum touch target of 48×48dp.
- Text contrast ratio must meet WCAG AA for body text (4.5:1).
- Dark theme must be fully functional and meet the same contrast requirements.
- System font scaling must be respected (Compose default behavior).
- Content must be readable with screen readers (TalkBack) on all screens.
- Color must never be the only differentiator (use icons + text alongside color).

### 6.4 Synchronization Expectations

- Sync is not required for V1. The MVP is fully offline.
- When sync is added, it must be silent and user-transparent.
- No sync status indicators in the UI.
- No "pull to refresh" for data.
- Conflicts resolved by latest timestamp (server clock wins on tie).
- Sync interval: 10 minutes (configurable).
- Change queue must persist locally and retry on failure.

### 6.5 Build and Distribution

- Target SDK: Android 14 (API 34) minimum, Android 15 (API 35) target.
- Min SDK: Android 10 (API 29).
- App bundle (AAB) for Google Play distribution.
- No third-party analytics SDKs.
- No crash reporting SDKs in the initial release (opt-in later).
- App size target: under 15 MB.