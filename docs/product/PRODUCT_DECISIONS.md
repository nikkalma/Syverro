# Syverro — Product Decisions

## Why the personal library is the primary screen

The app is built around what the reader owns, not what the store recommends. The library is the first thing users see after login because the core contract of Syverro is: *your books, your data, your control*. There is no marketplace, no recommendations engine, no algorithmic feed. The user populates their own collection.

## Why sessions work this way

Reading sessions exist because most reading trackers only track finished books. Syverro tracks the *process* — start page, end page, elapsed time, pauses. This mirrors how real reading happens: in chunks, with interruptions. Sessions produce automatic statistics (pages per minute, daily patterns) without requiring the user to log anything beyond start/end page.

Sessions are timer-based but not stopwatch-obsessed. The timer runs in the background. The user enters the start page before beginning and the end page when finishing. Everything else (duration, pages read, pace) is derived.

## Why there is no gamification

Gamification was deliberately excluded. Reading is not a competition. Streaks, badges, leaderboards, and achievement unlocks create extrinsic motivation that fades and often distorts behavior (e.g., gaming the streak instead of reading). Syverro uses *insight* instead: neutral patterns, personal statistics, genre distribution. The motivation is self-awareness, not points.

## Why calm-tech is the design philosophy

Reading is a low-stimulus activity. The app should never compete with the book for attention. This means:
- No push notifications for reading reminders
- No animated onboarding
- No full-screen splash videos
- No "you haven't read in 3 days" guilt messages
- Muted colors, low contrast, frosted glass surfaces instead of solid bright panels

The app should feel like a reading lamp, not a slot machine.

## Why offline-first exists

Reading happens everywhere, including places without internet (public transport, remote locations, airplanes). The app must work fully offline. Synchronization is secondary. The primary data store is local SQLite. The server is a backup and sync target, not the source of truth.

## Why synchronization exists despite offline-first

Sync enables device migration and data safety. It is async, silent, and user-transparent. The user never sees "syncing..." or "pull to refresh". Changes are queued locally and pushed when connectivity is available. Conflicts are resolved by timestamp (latest wins by default).

## Why atmosphere is separated from genre

Genre describes what the book *is* (fantasy, science fiction, history). Atmosphere describes how the book *feels* (melancholic, cozy, tense, dreamlike). These are orthogonal dimensions. A user might want to find "cozy books" regardless of genre, or "tense fantasy" specifically. Separating them enables richer discovery without forcing books into single categories.

## Why graph navigation exists (conceptual)

Books form a graph: authors write multiple books, books share genres, genres connect to atmospheres, authors share countries or eras. A flat list loses this structure. The knowledge graph (planned for future versions) lets users traverse these connections naturally. From a book, find the author; from the author, see other books; from those books, discover related genres. This mirrors how readers actually discover books in the real world ("I liked this, what else is like it?").

## Why authentication exists but is minimal

Authentication is required for sync. Email/password accounts must verify mailbox ownership before receiving a normal authenticated session; registration creates an unverified account and issues no JWTs. Existing accounts are grandfathered as verified during migration to avoid an unexpected lockout. Token generation is separate from delivery because an email provider has not yet been selected.

The dormant Telegram Login Widget backend is accepted only when its server-side HMAC and `auth_date` freshness checks pass. It fails closed unless a bot token is configured. No other OAuth, social login, phone verification, or magic-link system is in scope. Authentication exists to protect the user's data on the server, not to build a user graph or enable marketing.

## Why there is no EPUB reader built in

Syverro tracks books the user reads *elsewhere*. It is not an EPUB reader. Building a reader would double the scope and introduce DRM, format support, typographic rendering, and licensing complexity. The app's value is metadata and reflection, not content delivery.

## Why dark theme is the default

Reading happens disproportionately in low-light environments (evening, night, before sleep). Dark theme reduces eye strain and matches reader behavior. Light theme exists for daytime use and accessibility.

## Why statistics are private

No sharing features, no social graphs, no "compare with friends". Reading statistics are personal. Sharing them would change user behavior (reading for show) and violate the calm-tech principle.
