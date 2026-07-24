# Syverro — Session Engine

## Purpose

A reading session is a bounded period of reading activity with a start page, end page, and elapsed time. Sessions produce the raw data for all statistics: pages read, time spent, reading speed, daily patterns, and genre preferences.

Sessions are the only time-based input the user provides. Everything else is derived.

---

## Session Lifecycle

A session progresses through exactly five states:

```
SELECT_BOOK → READY → ACTIVE → (PAUSED) → COMPLETED
```

There is no "draft" or "interrupted" state. A session is either not started, in progress, paused, or finished.

---

## 1. Book Selection

Before a session can begin, the user must select a book from those currently marked as "reading". The screen shows a horizontal scroll of eligible books. The user taps one to select it.

The selected book's current page number pre-fills the "start page" input. The user may override this value if they began reading earlier without starting a session.

**Rule:** Sessions cannot be created for books with status other than "reading". If no books have this status, the session screen displays explanatory text and a suggestion to add books in the Library.

---

## 2. Start Page

The user confirms the page they are starting from. Default is the book's currentPage value. Validation:
- Must be a positive integer
- Must be ≤ the book's totalPages (if totalPages is set)
- Must be ≥ 1

---

## 3. Timer — Start

When the user taps "Start session":
- The timer begins counting seconds elapsed
- The book is set as the active book (highlighted in HomeScreen)
- Start time is recorded (epoch millisecond timestamp)
- Paused duration is initialized to 0

**The timer is strictly client-side.** It does not communicate with the server during the session. It runs on device time (Date.now()) and updates every second via a repeating interval.

---

## 4. Timer — Pause

The user may pause at any time. While paused:
- The displayed elapsed time freezes
- A "Paused" label appears
- The pause timestamp is recorded

**Resume:** On resume, the difference between pause start and resume is added to pausedDuration. The timer resumes from the frozen value.

**Multiple pauses:** Each pause/resume cycle accumulates into pausedDuration. The formula for elapsed time is:

```
elapsedSeconds = (Date.now() - startTime - pausedDuration) / 1000
```

---

## 5. Timer — Resume

Resume reverses pause:
- Subtract the pause period from pausedDuration
- Timer continues from the previous displayed value
- No data is transmitted to the server

---

## 6. End Page

Before ending, the user enters the final page reached. Validation:
- Must be a positive integer
- Must be > start page
- Must be ≤ totalPages (if set)

If the end page equals or exceeds totalPages, the book status is automatically set to "finished".

---

## 7. Completion

When "End session" is tapped:
- Timer stops
- Pages read = endPage − startPage
- Duration = elapsedSeconds
- A session object is created with:

| Field | Source |
|-------|--------|
| id | Generated UUID |
| bookId | Selected book |
| startPage | User input |
| endPage | User input |
| pagesRead | Derived (end − start) |
| duration | Timer (seconds) |
| startTime | Epoch ms on session start |
| endTime | Epoch ms on session end |
| status | "completed" |

- The session is saved to SQLite and added to the in-memory store
- The book's currentPage is updated to endPage
- The book's lastRead is updated to current timestamp
- An alert displays: "Read {pages} pages in {minutes} minutes"
- The user is returned to the ready state with the updated start page

---

## 8. History

The session screen shows the last 10 sessions for the selected book in a chronological list. Each entry shows:
- Date
- Pages read
- Duration (mm:ss)

**Actions:**
- Delete individual session (with confirmation dialog)
- Clear all sessions for this book (with confirmation, destructive)

---

## 9. Quote Capture During Session

During an active session, the user may capture a quote without ending the session. The quote modal records:
- Quote text (required)
- Page number (optional)
- Personal comment (optional)
- Session duration at capture time (optional)

The quote is saved immediately to the store and linked to the book. It does not affect the session timer.

---

## 10. Automatic Statistics

The following values are derived automatically from sessions. No additional user input is required:

| Statistic | Derivation |
|-----------|------------|
| Pages read (total) | Sum of all completed session pagesRead |
| Reading time (total) | Sum of all completed session durations |
| Reading speed | Total pages / total hours |
| Sessions per book | Count of sessions for that book |
| Weekly activity | Duration per weekday, aggregated across all sessions |
| Average session length | Total duration / total session count |
| Best day | Weekday with highest total duration |

---

## 11. Synchronization

Sessions are synced to the server via the same change-queue mechanism as books:
- On session creation, a Change record is enqueued
- The change is pushed on the next sync cycle (every 10 minutes or on explicit trigger)
- Conflict resolution: latest timestamp wins

**Offline behavior:** Sessions are fully functional offline. The change queue stores them locally. Synchronization is eventual and silent.

---

## 12. Offline Behavior

Sessions work identically online and offline. There is no online requirement for:
- Starting a session
- Timer operation
- Pausing or resuming
- Ending a session
- Viewing history
- Calculating statistics

The only difference is that synced devices will not see the session until the device comes online and pushes its change queue.

---

## 13. Future Integrations

- **Audiobook support:** Sessions with no page data, only duration. Start/end "page" replaced with chapter markers or position markers.
- **Session tagging:** Optional labels (e.g., "morning reading", "commute", "before sleep") for richer pattern analysis.
- **Background timer:** Restore timer state across app restart using persisted startTime + pausedDuration.
- **Distraction logging:** Optional "interrupted by" field (notification, phone call, environment noise).
- **Focus mode integration:** Combine with system "Do Not Disturb" or reading focus mode on Android.

---

## Constraints

- A session cannot be edited after creation. Delete and re-create instead.
- Only one active session per book at a time. Starting a new session for the same book while another is active is prevented.
- Multiple books can have sessions independently, but only one active session across all books.