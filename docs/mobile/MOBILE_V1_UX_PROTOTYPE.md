# Syverro Mobile V1 — UX Prototype (Revision 2)

## ⚠️ Draft — Visual Reference Only (Iterating)

Updated per product feedback. Navigation not finalized yet.
This revision adds empty states, returning user flow, discovery flow, and 3 navigation options.

---

## 1. Revised Design Principles

Based on feedback: Syverro should feel like:

> "A personal library that reads with you."

Not a habit tracker. Not a catalog. A quiet, warm space where books and reading live.

- **Library/archive feeling** — shelves, browsing, atmosphere
- **Calm technology** — no notifications, no urgency, no interruption
- **Editorial interface** — typography-forward, spacious, intentional
- **Not generic productivity** — no progress bars that look like workout streaks

---

## 2. First Launch Flow (Revised: Option B/C Hybrid)

```
Install → Splash → Library (empty) → Browse catalog → Build local library
                                                           │
                                                    [after value demonstrated]
                                                           │
                                              ┌────────────┴────────────┐
                                              │                         │
                                   "Create your profile to save        │
                                    your library across devices."      │
                                              │                         │
                                              ▼                         │
                                      Register / Login                 │
                                              │                         │
                                              ▼                         │
                                      First sync: calm                 │
                                      "Preparing your library..."      │
                                              │                         │
                                              ▼                         │
                                      Full app (all features)          │
                                                                        │
                                   Guest can keep using locally ───────┘
                                   (data preserved if they register later)
```

**Key principle:** The user discovers value *before* being asked to commit.
The registration prompt appears contextually (after adding 3+ books), not immediately.

---

## 3. Navigation: 3 Options to Compare

Settings removed from bottom navigation in all options.
Settings lives inside Profile (gear icon in header).

---

### Option A: Home / Library / Session / Profile

```
┌──────────────────────────────────────────────┐
│                                              │
│              Screen Content                  │
│                                              │
│                                              │
│                                              │
├──────────────────────────────────────────────┤
│   ◇ Home    ■ Library    ▶ Session    ● Me  │
│   "Now"     "My Books"   "Read"      "Me"   │
└──────────────────────────────────────────────┘

HOME tab:
┌─────────────────────────────────────┐
│  ◁ Home                        ⚙   │
│                                     │
│  ┌── Active Book ────────────────┐  │
│  │ [large cover]                 │  │
│  │ Title                         │  │
│  │ Author                        │  │
│  │ ████████████░░ 62%            │  │
│  │ [Continue Reading]            │  │
│  └──────────────────────────────┘  │
│                                     │
│  You're reading:                    │
│  [O] [P] [T] [Y] (horizontal)     │
│                                     │
│  12 books total                     │
└─────────────────────────────────────┘

"Now" space. Calm entry point.
```

**Character:** "Here is where you are. One book, one moment."

---

### Option B: Library / Discover / Session / Profile

```
┌──────────────────────────────────────────────┐
│                                              │
│              Screen Content                  │
│                                              │
│                                              │
│                                              │
├──────────────────────────────────────────────┤
│   ■ Library    ⊙ Discover    ▶ Session  ● Me│
│   "My Books"   "Explore"     "Read"   "Me"  │
└──────────────────────────────────────────────┘

LIBRARY tab (default landing):
┌─────────────────────────────────────┐
│  ◁ Library                     + ⚙ │
│                                     │
│  ┌── Active Book ────────────────┐  │
│  │ [smaller hero card]           │  │
│  │ Title — 187/300               │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──┐ ┌──┐ ┌──┐                    │
│  │Д │ │О │ │П │                    │
│  │  │ │  │ │  │                    │
│  │  │ │  │ │  │                    │
│  └──┘ └──┘ └──┘                    │
│  ┌──┐ ┌──┐ ┌──┐                    │
│  │Т │ │У │ │Ф │                    │
│  │  │ │  │ │  │                    │
│  │  │ │  │ │  │                    │
│  └──┘ └──┘ └──┘                    │
│                                     │
│  42 books                           │
└─────────────────────────────────────┘

"Your library is home. Active book is part of it."
```

**Character:** "This is your shelf. Everything lives here."

---

### Option C: Home / Library / Session / Profile / Settings

```
┌──────────────────────────────────────────────┐
│                                              │
│              Screen Content                  │
│                                              │
│                                              │
│                                              │
├──────────────────────────────────────────────┤
│  ◇ Home  ■ Library  ▶ Session  ● Profile ⚙ │
│  "Now"   "My Books"  "Read"    "Me"   "Set" │
└──────────────────────────────────────────────┘
```

Only keep 5 if Settings has daily value.
Settings as a tab makes sense if user changes theme/language frequently.
Otherwise, Settings in Profile header (⚙ icon).

**My recommendation:** Settings inside Profile. The ⚙ icon in the top-right of the Profile screen leads to settings. This frees a tab slot and prevents Settings from competing for attention.

---

## 4. Revised Core Screen Prototypes

### 4.1 Home (Option A — dedicated "Now" tab)

```
┌──────────────────────────────────────────┐
│  12:34                                   │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │      [Cover — large, 3:4]         │  │
│  │                                    │  │
│  │  The Name of the Wind              │  │
│  │  Patrick Rothfuss                  │  │
│  │                                    │  │
│  │  ━━━━━━━━━━━━━━━━━━━━━━░░  62%    │  │
│  │  187 of 300 pages                  │  │
│  │                                    │  │
│  │  ┌──────────────────────────┐     │  │
│  │  │ Continue Reading    →   │     │  │
│  │  └──────────────────────────┘     │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Still reading:                           │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐              │
│  │Д │ │О │ │П │ │Т │ │Ф │              │
│  │  │ │  │ │  │ │  │ │  │              │
│  └──┘ └──┘ └──┘ └──┘ └──┘              │
│                                          │
│  ─ 12 books in library ─                 │
│                                          │
├──────────────────────────────────────────┤
│ ◇  ■  ▶  ●                              │
└──────────────────────────────────────────┘
```

**Empty state (no active book, no books at all):**
```
┌──────────────────────────────────────────┐
│                                          │
│                          (minimal)       │
│                                          │
│              ┌──────────┐                │
│              │  (empty   │                │
│              │   shelf   │                │
│              │   icon)   │                │
│              └──────────┘                │
│                                          │
│        Your library is empty             │
│                                          │
│     "A library is not a luxury,          │
│      but one of the necessities          │
│      of life."                           │
│           — Henry Ward Beecher           │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │  Add your first book        →   │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ─── or ───                              │
│                                          │
│  Browse the catalog to discover          │
│  what other readers are enjoying.        │
│                                          │
│  [Explore Catalog]                       │
│                                          │
├──────────────────────────────────────────┤
│ ◇  ■  ▶  ●                              │
└──────────────────────────────────────────┘
```

**No active book but library has "reading" books:**
```
┌──────────────────────────────────────────┐
│                                          │
│    You're not currently reading          │
│                                          │
│    ┌──┐ ┌──┐ ┌──┐                       │
│    │Д │ │О │ │П │                       │
│    │  │ │  │ │  │                       │
│    │  │ │  │ │  │                       │
│    └──┘ └──┘ └──┘                       │
│                                          │
│    Pick up where you left off.           │
│                                          │
├──────────────────────────────────────────┤
│ ◇  ■  ▶  ●                              │
└──────────────────────────────────────────┘
```

---

### 4.2 Library

```
┌──────────────────────────────────────────┐
│  ◁ Library                      +  ⚙   │
│                                          │
│  ┌── Active ──────────────────────────┐  │
│  │  [cover] The Name of the Wind      │  │
│  │           187/300  ➤               │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [Filter: All] [Reading] [Planned] [↕]  │
│                                          │
│  ┌──┐ ┌──┐ ┌──┐                          │
│  │Д │ │О │ │П │                          │
│  │  │ │  │ │  │                          │
│  │ ★│ │  │ │  │                          │
│  └──┘ └──┘ └──┘                          │
│  ┌──┐ ┌──┐ ┌──┐                          │
│  │  │ │  │ │  │                          │
│  └──┘ └──┘ └──┘                          │
│                                          │
│  42 books                                │
│                                          │
├──────────────────────────────────────────┤
│ ◇  ■  ▶  ●                              │
└──────────────────────────────────────────┘
```

**Empty state:**
```
┌──────────────────────────────────────────┐
│                                          │
│              ┌──────────┐                │
│              │  empty    │                │
│              │  shelf    │                │
│              │  drawing  │                │
│              └──────────┘                │
│                                          │
│   Start building your library            │
│                                          │
│   ┌────────────────────────────────┐    │
│   │  Search the catalog...         │    │
│   └────────────────────────────────┘    │
│                                          │
│   Or add a book manually:                │
│   Title [________________]               │
│   Author [________________]              │
│   ┌────────────────────────────┐        │
│   │  Add to Library            │        │
│   └────────────────────────────┘        │
│                                          │
├──────────────────────────────────────────┤
│ ◇  ■  ▶  ●                              │
└──────────────────────────────────────────┘
```

**Status indicators (minimal):**
- **Reading:** No chip needed — the user knows they're reading this book. Instead, show a subtle progress bar at the bottom of the card (1px height, muted color).
- **Finished:** Small "✓ Finished" text below the author in secondary color.
- **Planned:** Small "○ Planned" text in secondary color.
- **Postponed/Abandoned/Rereading:** No indicator. These are management states, not discovery states.

---

### 4.3 Book Details

```
┌──────────────────────────────────────────┐
│  ◁ Back                           [Edit]│
│                                          │
│  ┌────────────────────────────────────┐  │
│  │        [Cover — 2:3]              │  │
│  │        Centered, breathing space   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  The Name of the Wind                   │
│  Patrick Rothfuss                       │
│                                          │
│  ──────────────────────────────────────  │
│                                          │
│  ▰ Reading          187/300 pages        │
│  ━━━━━━━━━━━━━━━━━━━━━━░░               │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Start a new reading session →    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ──────────────────────────────────────  │
│                                          │
│  Literary fiction  ·  Fantasy           │
│  English (original)                     │
│  Published 2007                         │
│  Kingkiller Chronicle #1                │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ "A young man's journey from        │  │
│  │  rural poverty to legendary        │  │  │
│  │  wizardry..."                      │  │
│  │                        [read more] │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ★ Favorite       ⋮ Status              │
│                                          │
├──────────────────────────────────────────┤
│ (bottom sheet on tap, covers tab bar)    │
└──────────────────────────────────────────┘
```

---

### 4.4 Session

```
┌──────────────────────────────────────────┐
│  ◁ Reading Session                       │
│                                          │
│  Reading:                                │
│  [Name of Wind] [O] [P] [T]  (scroll)   │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │                                    │  │
│  │  The Name of the Wind              │  │
│  │  Patrick Rothfuss                  │  │
│  │                                    │  │
│  │  Start page: [ 187 ]               │  │
│  │                     ═══════        │  │
│  │                                    │  │
│  │  ┌────────────────────────────┐   │  │
│  │  │        00:23:47            │   │  │
│  │  │                            │   │  │
│  │  │   ┌───┐  ┌───┐  ┌───┐     │   │  │
│  │  │   │ ⏸ │  │ 📋│  │ ⏹ │     │   │  │
│  │  │   └───┘  └───┘  └───┘     │   │  │
│  │  │   Pause  Quote   End      │   │  │
│  │  └────────────────────────────┘   │  │
│  │                                    │  │
│  │  End page: [ ___ ]                 │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Recent sessions:                         │
│  ─────────────────────────────────────── │
│  Today        23 pages  24 min           │
│  Yesterday    15 pages  18 min           │
│  Jul 20       31 pages  42 min           │
│  ─────────────────────────────────────── │
│                                          │
├──────────────────────────────────────────┤
│ ◇  ■  ▶  ●                              │
└──────────────────────────────────────────┘
```

**Empty state (no books with status "reading"):**
```
┌──────────────────────────────────────────┐
│                                          │
│              ┌──────────┐                │
│              │  (book    │                │
│              │   icon)   │                │
│              └──────────┘                │
│                                          │
│   No books in progress                   │
│                                          │
│   Mark a book as "reading" in your       │
│   library to start tracking sessions.    │
│                                          │
│   ┌────────────────────────────────┐    │
│   │  Go to Library                 │    │
│   └────────────────────────────────┘    │
│                                          │
├──────────────────────────────────────────┤
│ ◇  ■  ▶  ●                              │
└──────────────────────────────────────────┘
```

**Empty state (book selected, no sessions yet):**
```
┌──────────────────────────────────────────┐
│  ◁ Reading Session                       │
│                                          │
│  Reading: [Name of Wind]                 │
│                                          │
│  The Name of the Wind                    │
│  Patrick Rothfuss                        │
│                                          │
│  Start page: [ 1 ]                       │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │      [Start your first session]   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ─────────────────────────────────────── │
│  No reading sessions yet                 │
│  ─────────────────────────────────────── │
│                                          │
├──────────────────────────────────────────┤
│ ◇  ■  ▶  ●                              │
└──────────────────────────────────────────┘
```

---

### 4.5 Profile (Revised — Natural Language First)

```
┌──────────────────────────────────────────┐
│  ◁ Profile                         ⚙   │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │           🌻                        │  │
│  │                                    │  │
│  │        Alex                        │  │
│  │     Reader since June 2026         │  │
│  │                                    │  │
│  │     ┌──────────────────────────┐   │  │
│  │     │         62%              │   │  │
│  │     │   (circular ring)        │   │  │
│  │     └──────────────────────────┘   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ◆ Your reading:                         │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ "You usually read literary         │  │
│  │  fiction late at night. Your       │  │
│  │  longest session was 2 hours and   │  │
│  │  14 minutes. You return to         │  │
│  │  philosophical themes more often   │  │
│  │  than most readers."               │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ "This month you read mostly        │  │
│  │  speculative fiction. Your most    │  │
│  │  active day was Tuesday."          │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Genres read:                             │
│  Literary fiction ━━━━━━ 5               │
│  Philosophy       ━━━━━  3               │
│  Poetry           ━━━    2               │
│                                          │
│  [Show more insights →]                  │
│                                          │
├──────────────────────────────────────────┤
│ ◇  ■  ▶  ●                              │
└──────────────────────────────────────────┘
```

**Emphasis:** Natural language first. Raw metrics are secondary, smaller, lower in the hierarchy.

**Settings access:** ⚙ icon in the top-right of Profile header.

**Empty state (no reading history):**
```
┌──────────────────────────────────────────┐
│                                          │
│              ┌──────────┐                │
│              │  (reader  │               │
│              │   figure) │               │
│              └──────────┘                │
│                                          │
│        Alex                              │
│     Reader since June 2026               │
│                                          │
│  ──────────────────────────────────────  │
│                                          │
│  No reading history yet.                 │
│                                          │
│  Start with your first book and          │
│  your reading portrait will begin        │
│  to emerge.                              │
│                                          │
│  Add books in Library →                  │
│                                          │
├──────────────────────────────────────────┤
│ ◇  ■  ▶  ●                              │
└──────────────────────────────────────────┘
```

---

### 4.6 Quote Capture — Three Options

#### Option A: Modal During Session (Current)

```
┌──────────────────────────────────────────┐
│         00:23:47                    │
│  (timer visible through overlay)         │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  NEW QUOTE                          │  │
│  │                                    │  │
│  │  "The only way to deal with        │  │
│  │   an unfree world is to become     │  │
│  │   so absolutely free that your     │  │
│  │   very existence is an act of      │  │
│  │   rebellion."                      │  │
│  │                                    │  │
│  │  Page [ 187 ]    Note (optional)   │  │
│  │                  [____________]    │  │
│  │                                    │  │
│  │  ┌──────────┐  ┌──────────┐      │  │
│  │  │  Save    │  │  Cancel  │      │  │
│  │  └──────────┘  └──────────┘      │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

**Feel:** Interruptive but brief. Timer visible keeps connection to session.

#### Option B: Bottom Sheet (Recommended)

```
┌──────────────────────────────────────────┐
│                                          │
│                                          │
│         00:23:47                         │
│                                          │
│         (timer visible above sheet)      │
│                                          │
│  ════════════════════════════════════   │
│  ↕ Bottom sheet slides up                │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  "The only way to deal with        │  │
│  │   an unfree world is to become     │  │
│  │   so absolutely free..."           │  │
│  │                                    │  │
│  │  Page [187]    ┌──── Note ────┐   │  │
│  │                │ (optional)   │   │  │
│  │                └──────────────┘   │  │
│  │                                    │  │
│  │  ┌── Save ──┐                     │  │
│  │  └──────────┘                     │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Swipe down to dismiss                   │
└──────────────────────────────────────────┘
```

**Feel:** Less interruptive. The session screen is still visible above. The user can swipe down to return. Feels like pulling out a notepad, not switching tasks.

#### Option C: Dedicated Screen

```
┌──────────────────────────────────────────┐
│  ◁ Back to Session                       │
│                                          │
│  NEW QUOTE                               │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ "The only way to deal with         │  │
│  │  an unfree world is to become      │  │
│  │  so absolutely free that your      │  │
│  │  very existence is an act of       │  │
│  │  rebellion."                       │  │
│  │                                     │  │
│  │  Page [ 187 ]                       │  │
│  │  Note: [________________]          │  │
│  │                                     │  │
│  │  ┌──────────┐  ┌──────────┐       │  │
│  │  │  Save    │  │  Cancel  │       │  │
│  │  └──────────┘  └──────────┘       │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Session: 00:23:47 (paused)              │
│                                          │
└──────────────────────────────────────────┘
```

**Feel:** Full context switch. Session is paused while quote is captured. Most disruptive but gives the most space for longer quotes or multiple quotes.

**Recommendation: Bottom Sheet (Option B).**
Least interruption to reading flow while still providing full functionality.

---

## 5. Book Discovery Flow

How a user moves from unknown book → personal library → reading session.

```
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│                     │    │                     │    │                     │
│  DISCOVER           │    │  BOOK DETAIL        │    │  ADD TO LIBRARY     │
│                     │    │                     │    │                     │
│  ┌──┐ ┌──┐ ┌──┐   │    │  ┌──────────────┐   │    │  ┌──────────────┐   │
│  │Д │ │О │ │П │   │    │  │    Cover      │   │    │  │    Cover     │   │
│  │  │ │  │ │  │   │    │  └──────────────┘   │    │  └──────────────┘   │
│  └──┘ └──┘ └──┘   │    │                     │    │                     │
│                     │    │  Title              │    │  Add to your        │
│  Browse catalog     │    │  Author             │    │  library:           │
│  (pull from backend)│    │                     │    │                     │
│                     │    │  Literary fiction   │    │  ○ Want to read     │
│  Or search:         │    │  Philosophy         │    │  ● Currently reading│
│  [____________]     │    │                     │    │  ○ Already finished │
│                     │    │  ┌──────────────┐   │    │                     │
│                     │    │  │ Add to       │   │    │  Start page [    ]  │
│                     │    │  │ Library      │   │    │                     │
│                     │    │  └──────────────┘   │    │  ┌────────────────┐ │
│                     │    │                     │    │  │  Add to Library│ │
│                     │    │  ┌──────────────┐   │    │  └────────────────┘ │
│                     │    │  │ Read more →  │   │    │                     │
│                     │    │  └──────────────┘   │    │                     │
│                     │    │                     │    │                     │
└────────────────────┘    └────────────────────┘    └────────────────────┘
        │                          │                         │
        │                          │                         ▼
        │                          │              ┌────────────────────┐
        │                          │              │  LIBRARY           │
        │                          └──────────────│  (book appears     │
        │                                         │   in grid)         │
        │                                         └────────────────────┘
        │                                                 │
        └─────────────────────────────────────────────────┘
                                                           ▼
                                              ┌────────────────────┐
                                              │  SESSION           │
                                              │  (start reading)   │
                                              └────────────────────┘
```

**Discovery entry points:**
1. Library search tab (search by title/author)
2. Catalog browsing (pull from backend /books/catalog/)
3. Book details from catalog → add to library → session start

**The flow is: see → learn → add → read.**
Each step is optional — the user can skip directly to adding a book manually if they know what they want.

---

## 6. Returning User Flow

```
                    ┌──────────────────────┐
                    │  App opened           │
                    │  after 3 days away    │
                    └──────────┬───────────┘
                               │
                    ┌──────────┴───────────┐
                    │  Check: active       │
                    │  session in Room?    │
                    └──────────┬───────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
        [YES: active session]             [NO: no session]
              │                                 │
              ▼                                 ▼
    ┌──────────────────────┐      ┌──────────────────────┐
    │  HOME TAB            │      │  HOME TAB            │
    │                      │      │                      │
    │  "You were reading"  │      │  Active book (if     │
    │                      │      │  any "reading" books)│
    │  ┌── Resume ──────┐ │      │                      │
    │  │ [cover]        │ │      │  Or empty state      │
    │  │ Title          │ │      │  with "Pick up        │
    │  │ 187/300        │ │      │  where you left off" │
    │  │                │ │      │                      │
    │  │ [Resume →]     │ │      │  Total library:      │
    │  └────────────────┘ │      │  15 books             │
    │                      │      │                      │
    │  Timer was running   │      │                      │
    │  but app was closed. │      │                      │
    │  Elapsed time since  │      │                      │
    │  last pause shown.   │      │                      │
    └──────────────────────┘      └──────────────────────┘
```

**Session restoration after app kill:**
If the user had an active session:

```
Timer state restored from `active_session_state` table.
Elapsed time calculated: startedAt + pausedDuration vs now.
User sees:
  "You were reading. Resume or end this session?"
  
  [Resume]  [End Session]  [Discard]
```

If the user did NOT have an active session but had an active book:
```
Home tab shows active book with current page.
No timer. No "resume" prompt. Just "Continue Reading" button
that starts a new session.
```

---

## 7. First Sync Experience

```
┌──────────────────────────┐
│                          │
│     ◆ Syverro ◆          │
│                          │
│  Welcome, Alex.          │
│                          │
│  Preparing your library… │
│                          │
│  ┌────────────────────┐  │
│  │ ████████░░░░░░░░░░ │  │  ← Progress bar (calm)
│  │   Syncing your     │  │     Only when meaningful
│  │   books and        │  │     (>100 books)
│  │   reading history  │  │
│  └────────────────────┘  │
│                          │
│  ─────────────────────── │
│                          │
│  (small text)            │
│  Your data stays private │
│  and offline-first.      │
│                          │
└──────────────────────────┘
```

**Rules:**
- If < 50 books: no progress bar. Just a subtle "Preparing your library..." text for 1-2 seconds.
- If > 50 books: calm progress bar, no percentage numbers.
- If first sync fails silently: show the app anyway with local data. Show a small banner: "Sync will continue in the background."

---

## 8. Visual Atmosphere

The prototype assumes the existing design system from `docs/web/DESIGN_SYSTEM.md`:

- **Dark theme:** Deep navy #0B1220, muted blue #5C7C9A, off-white text
- **Light theme:** Warm beige #E0D4C3, muted slate #4A5A6A, warm dark text
- **Glass surfaces:** Frosted backgrounds on cards, buttons
- **Typography:** Playfair Display for book titles (serif, editorial), Inter for UI (sans-serif, clean)
- **Spacing:** 4-point grid, generous whitespace

**Not in this prototype (but in the design system):**
- Orb background animation (decorative, removed for V1 per MIGRATION_CHECKPOINT)
- No animated press effects on book cards (nice-to-have, deferred)

---

## 9. Summary of Decisions Pending Your Review

| # | Decision | Current Prototype Choice | Needs Confirmation |
|---|----------|------------------------|-------------------|
| 1 | Guest mode | B/C hybrid: explore first, register for preservation | ✅ |
| 2 | Navigation | 3 options shown (A/B/C) — recommendation: Settings inside Profile | Pending |
| 3 | ActiveBook | Derived from sessions | ✅ |
| 4 | Quote capture | Bottom sheet (Option B) | Pending |
| 5 | Profile style | Natural language first, raw metrics secondary | ✅ |
| 6 | First sync | Calm, "Preparing your library...", progress only for 50+ books | Pending |
| 7 | Status chips | Minimal: only Reading/Finished/Planned indicators | ✅ |
| 8 | Settings location | Inside Profile (⚙ icon) | Pending (related to #2) |

**Next step:**
Once you've reviewed the navigation options (A/B/C) and the visual prototypes, I'll update `docs/mobile/MOBILE_V1_UX_PROTOTYPE.md` with the final version, then proceed to architecture decisions and documentation updates.