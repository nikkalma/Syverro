# Syverro — UX Patterns

---

## AuthScreen

**Purpose:** Identify the user and gate access to the app.

**User goal:** Log in with existing credentials or register a new account.

**Required information:** Email, password.

**Optional information:** None.

**Primary action:** "Log in" or "Register" (toggle).

**Secondary actions:** Toggle between login and registration mode.

**Navigation entry:** App launch, no token found.

**Navigation exit:** Successful authentication → Main stack (Library/Tabs). Logout returns here.

**States:**
- *Empty:* Clean form with email/password fields
- *Loading:* Activity indicator on button, fields disabled
- *Error:* Alert dialog with server error message (invalid credentials, network failure)

**Empty state:** Initial launch, no stored token.

**Loading state:** Button shows spinner, inputs locked.

**Error state:** Native Alert with detail from server response.

**Future expansion:** Biometric unlock (fingerprint/face) for token-protected re-entry.

---

## LibraryScreen

**Purpose:** Browse, search, filter, sort, and manage the user's book collection.

**User goal:** Find a book, see what's available, add new books.

**Required information:** Book list from local database.

**Optional information:** Search query, status filter, sort order.

**Primary action:** Tap a book card → BookDetailsScreen.

**Secondary actions:** Add book (modal), toggle favorites, filter by status, sort, search.

**Navigation entry:** Tab "Library". Also reachable from HomeScreen "view all".

**Navigation exit:** Tap book → BookDetailsScreen. Tab switch.

**States:**
- *Grid:* Books displayed in 3-column grid with cover, title, author, rating
- *Search bar:* Collapsible, appears on search icon tap
- *Filter modal:* Status chips (all, reading, finished, planned, rereading, postponed, abandoned)
- *Sort modal:* Date, title, author, rating, progress
- *Add modal:* Title (required), author (optional)

**Empty state:** "Library is empty. Tap + to add" with illustration.

**Loading state:** Not applicable (data loaded before screen appears).

**Error state:** Not applicable (data is local).

**Future expansion:** Bulk import (CSV, Goodreads export), list view toggle, tag system, reading goal progress.

---

## BookDetailsScreen

**Purpose:** View and edit all metadata for a single book.

**User goal:** See book details, update status/progress, write review, delete book.

**Required information:** Book object from store.

**Optional information:** Cover image, genres, languages, series info, dates, review, notes.

**Primary action:** Edit (toggle ViewMode ↔ EditMode).

**Secondary actions:** Set active book, delete book, mark finished.

**Navigation entry:** Tap book card in LibraryScreen or HomeScreen.

**Navigation exit:** Back navigation (header back or gesture).

**States:**
- *View mode:* Read-only display of all book fields, edit button visible
- *Edit mode:* All fields editable, save/cancel buttons

**Empty state:** "Book not found" — should not occur under normal conditions.

**Loading state:** Not applicable (data is in store).

**Error state:** Not applicable (local data).

**Future expansion:** Reading session start from this screen, related books, author page link, quote list filtered by book.

---

## SessionScreen

**Purpose:** Start, monitor, and complete a timed reading session.

**User goal:** Log reading progress (pages + time) for a currently-reading book.

**Required information:** Selected book, start page.

**Optional information:** End page (entered at session end). Quote text, page, note.

**Primary action:** "Start session" button → timer begins.

**Secondary actions:** Pause/resume, add quote during session, end session, delete past sessions, clear history.

**Navigation entry:** Tab "Session". Only functional when at least one book has status "reading".

**Navigation exit:** Tab switch.

**States:**
- *No active book:* Message: "Select a book to read". Horizontal scroll of reading books.
- *Session ready:* Book selected, start page set, "Start session" visible.
- *Session active:* Timer running, end page input, pause/quote/end buttons.
- *Session paused:* Timer frozen, "Paused" label, resume/end buttons.
- *Session ended:* Alert showing pages read and duration. Session saved to history.
- *History:* List of past sessions for selected book, with delete per item and clear-all.

**Empty state:** No books with status "reading". Message suggests adding books.

**Loading state:** Not applicable.

**Error state:** Alerts for invalid page numbers (greater than total, less than start, non-numeric).

**Future expansion:** Audiobook session support (duration-only, no pages), reading speed graph, session streaks calendar.

---

## HomeScreen

**Purpose:** Dashboard showing current reading status at a glance.

**User goal:** See active book, quickly navigate to book details, see reading-in-progress collection.

**Required information:** Active book (marked by user or first book with status "reading").

**Optional information:** Notes preview on active book.

**Primary action:** Tap active book → BookDetailsScreen.

**Secondary actions:** Tap any "currently reading" book card → BookDetailsScreen. Open drawer menu (hamburger).

**Navigation entry:** Drawer default screen or tab "Home" (if tab exists).

**Navigation exit:** Tab switch, drawer navigation.

**States:**
- *Active book + reading books:* Both sections visible.
- *Only reading books:* No active book highlighted, grid shown.
- *No books at all:* Empty state message.

**Empty state:** "No books in progress. Add books in Library."

**Loading state:** Not applicable (data from store).

**Error state:** Not applicable (local data).

**Future expansion:** Weekly reading summary, daily reading goal indicator, recent activity feed.

---

## ProfileScreen

**Purpose:** Show aggregated reading statistics and personal information.

**User goal:** See reading progress, genre distribution, weekly activity, edit avatar/name.

**Required information:** All books, all sessions from store.

**Optional information:** Avatar emoji, display name.

**Primary action:** Edit avatar/name.

**Secondary actions:** View observations (insights generated from data).

**Navigation entry:** Tab "Profile".

**Navigation exit:** Tab switch.

**States:**
- *Profile header:* Avatar (emoji), name, member date, edit triggers
- *Reading progress:* Total books, finished, completion percentage (circular indicator)
- *Top genres:* Bar chart of top 3 genres by book count
- *Weekly activity:* Heatmap-style chart of reading time per weekday
- *Observations:* Cards with auto-generated insights

**Empty state:** Default avatar, "Reader" name, zero stats, "Add your first book" message.

**Loading state:** Not applicable.

**Error state:** Not applicable.

**Future expansion:** Reading goal visualization, annual reading challenge, mood tracking overlay.

---

## SettingsScreen

**Purpose:** Configure app preferences and manage data.

**User goal:** Change theme, language, export/import data, reset statistics.

**Required information:** None (reads preferences from AsyncStorage).

**Optional information:** None.

**Primary action:** Toggle theme / language.

**Secondary actions:** Export library (JSON), reset statistics, navigate to About.

**Navigation entry:** Tab "Settings".

**Navigation exit:** Tab switch.

**States:**
- *Theme:* Light / Dark / System. Modal picker.
- *Language:* Russian / English / Belarusian / Ukrainian. Modal picker.
- *Data section:* Export button (generates JSON file, shares via system share sheet).
- *Clear section:* Reset statistics (destructive, confirmation dialog).

**Empty state:** Not applicable.

**Loading state:** Export in progress (spinner on button).

**Error state:** Alert if export fails, Alert if share unavailable.

**Future expansion:** Import from Goodreads CSV, iCloud/Google Drive sync toggle, notification settings.

---

## QuotesScreen

**Purpose:** Browse, filter, and manage quotes captured during reading sessions.

**User goal:** Review saved quotes, edit comments, delete quotes.

**Required information:** Quotes from store.

**Optional information:** Search query, book filter.

**Primary action:** Read quote text.

**Secondary actions:** Edit comment (modal), delete quote, filter by book.

**Navigation entry:** Drawer menu or from BookDetailsScreen.

**Navigation exit:** Back navigation.

**States:**
- *Search bar:* Filters quotes by text content
- *Book filters:* Horizontal scroll of books that have quotes
- *Quote cards:* Italic text, book title, date, page number, reading time, comment

**Empty state:** "No quotes. Add a quote during a reading session."

**Loading state:** Not applicable.

**Error state:** Not applicable.

**Future expansion:** Quote image sharing (stylized card), quote of the day widget, export quotes collection.

---

## AboutScreen

**Purpose:** Communicate the app's philosophy and version information.

**User goal:** Understand what Syverro is, contact the developer.

**Required information:** App version from package.json.

**Optional information:** None.

**Primary action:** Read content.

**Secondary actions:** Email developer (opens mail client), share app.

**Navigation entry:** SettingsScreen → About.

**Navigation exit:** Back navigation.

**Empty state:** Not applicable.

**Loading state:** Not applicable.

**Error state:** Not applicable.

**Future expansion:** Changelog, open-source license, contributor credits.