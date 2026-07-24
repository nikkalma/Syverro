# Syverro — Migration Checkpoint: Expo Prototype → Native Kotlin

## KEEP

### Product Ideas
- Personal library as the primary surface — your books, your data, your control
- Reading sessions that track process (start page, end page, elapsed time), not just finished books
- Quote capture during active sessions
- Atmosphere as a separate dimension from genre (feeling vs category)
- Knowledge graph connecting books → authors → genres → atmospheres → countries
- Calm-tech philosophy: no gamification, no notifications, no algorithmic feeds
- Private statistics with no social sharing
- Dark theme as default with light theme for accessibility
- Offline-first: local SQLite as source of truth, sync as secondary concern

### UX Decisions
- Three-column book grid with cover, title, author, rating
- Animated press feedback on book cards (opacity transition, 120ms)
- Bottom tab navigation with 4 tabs: Profile, Library, Session, Settings
- Book detail with view/edit toggle mode
- Session timer with pause/resume and cumulative pause duration tracking
- Horizontal book selector chip row for session screen
- Filter by status (7 states: all, reading, finished, planned, rereading, postponed, abandoned)
- Sort by date, title, author, rating, progress
- Collapsible search bar in library
- Status auto-advance: end page >= total pages → status becomes "finished"
- Rating on 1–5 scale with distinct buttons
- Book cover placeholder showing first letters when no image
- Favorite toggle on book cards with visual indicator
- Slide-to-delete pattern for sessions and quotes
- Profile header with avatar emoji and editable name
- Reading progress ring (circular percentage)
- Top 3 genres bar chart
- Weekly activity bar chart
- Auto-generated reading observations/insights
- Quote browser with search and book-filter chips
- Export library as JSON via system share sheet
- Destructive action confirmation (two-step for delete)

### Business Logic Concepts
- Book status lifecycle: planned → reading → finished (with rereading, postponed, abandoned branches)
- Active book concept: one book highlighted across the app as "currently reading"
- Session → Statistics pipeline: sessions produce pagesRead, duration, which feed all statistics
- Statistics derivation: completion %, top genres (by book count), weekly activity (by session duration sum), reading speed (pages / time), best day (highest activity)
- Insight engine: computed observations (format preference, country diversity, fastest book, average session length, chronotype, favorite reading day)
- Sync architecture: change queue → push/pull → conflict resolution (latest timestamp wins)
- Soft delete (deleted_at) for books and sessions
- Device ID generation for sync identity
- i18n system with Russian, English, Belarusian, Ukrainian and parameter interpolation (`{param}`)
- Type system: Book, ReadingSession, Quote, Profile with rich field sets

### Design Tokens
- 4-point spacing grid (xs=4, sm=8, md=12, lg=16, xl=20, xxl=24, xxxl=32, huge=40)
- Border radius scale (none=0, xs=4, sm=8, md=12, lg=16, xl=20, xxl=24, full=999)
- Typography scale (display=48, h1=28, h2=20, h3=16, body=14, secondary=12, caption=10, mono=12)
- Light theme palette: warm beige background (#E0D4C3), muted slate primary (#4A5A6A), warm dark text (#2A2622)
- Dark theme palette: deep navy background (#0B1220), muted blue primary (#5C7C9A), off-white text (#E7EDF5)
- Color roles: background, surface, textPrimary, textSecondary, textMuted, primary, primarySoft, accent, accentSoft, success, warning, error, info, border, card, chip, glassBackground, glassBorder
- Font families: Inter (UI), Playfair Display (display headings), NotoSansJP/KR (CJK support)
- Glassmorphism constants: background opacity, border opacity, blur radius, padding

---

## REDESIGN

### Navigation Architecture
**Problem:** AppNavigator registers Auth screen twice (root stack + inner stack), AuthScreen navigates to a route (`MainTabs`) that doesn't exist in the parent navigator. Drawer is imported (`DrawerActions`) but never configured.

**Target:** Single navigator tree. Auth gated at the top level. Type-safe route parameters. Deep linking support.

### Session Timer
**Problem:** Uses `Date.now()` with manual pause accumulation. Timer runs on 1-second `setInterval` — inaccurate over long sessions and janky on slow devices. No background timer persistence.

**Target:** Use `SystemClock.elapsedRealtime()` (Android) for accurate elapsed time. Persist timer state so sessions survive app restart. Use Coroutine-based timer instead of polling.

### Insight Engine
**Problem:** Hardcoded as React hooks in `Observations.tsx` and `useProfileStats.ts`. Quote of the day is random (changes on every render). Comments are in Russian. Logic is duplicated inline.

**Target:** Extract into a dedicated analytics service/class. Deterministic quote-of-day (seeded by date + user ID). Localized messages driven by string resources.

### Chart Components
**Problem:** Mixed use of `victory-native` (heavy, 500KB+) and manual `react-native-svg`. ProgressRing and TopGenresBar duplicate the same SVG patterns.

**Target:** Single Compose-native chart abstraction using Canvas API. No third-party charting library. Direct Compose `Canvas` composable for rings, bars, and sparklines.

### Book Editing Form
**Problem:** 632-line monolithic component (`EditMode.tsx`) with inline styles, hardcoded field lists, `any` type bypasses, and no validation library.

**Target:** Compose form with proper state hoisting, field-level validation, reactive form state. Reusable field components (text field, number field, date picker, tag picker, rating selector, image picker).

### Database Schema
**Problem:** Current SQLite schema is minimal and incomplete. Missing fields: genres, languages, series, readingFormat, authorCountry, originalYear, cover url, notes, review, favorite. The `quotes` and `sessions` tables lack columns needed by the type definitions. The `change_queue` and `sync_state` tables are referenced but never created.

**Target:** Room database with full entity definitions matching the type system. Migration support for future schema changes. DAO layer with Flow-based reactive queries.

### API Client
**Problem:** Hardcoded URL (`https://api.syverro.com`). No timeout, no retry, no error interceptor. Token stored in AsyncStorage with no refresh mechanism.

**Target:** Configurable base URL via build flavors. OkHttp client with interceptors for auth, logging, retry. Encrypted token storage (EncryptedSharedPreferences). Refresh token rotation.

### Sync Engine
**Problem:** `syncAPI.ts` is a full mock returning hardcoded responses. `syncEngine.ts` uses `(bookRepository as any).applyServerState()` — method doesn't exist. Connectivity check uses `navigator.onLine` (web API).

**Target:** Retrofit-based API client with real endpoints. `applyServerState` method on repository. `ConnectivityManager` for network state.

### Two-File Duplication
**Problem:** `services/bookService.ts` and `db/bookService.ts` are near-duplicates. The sync module has both `changeQueue.ts` (in-memory, unused) and `changeQueueRepository.ts` (SQLite, used).

**Target:** Single `BookService` class. Remove dead `changeQueue.ts`.

---

## REMOVE

### Prototype Limitations

| Item | Reason |
|------|--------|
| Stub store methods for sessions, quotes, profile | All three are `console.log` no-ops. Must be real SQLite-backed implementations. |
| `crypto.randomUUID()` with fallback | Not available in React Native. Replace with `java.util.UUID.randomUUID()` in Kotlin. |
| `(bookRepository as any).applyServerState()` | Cast to `any` bypasses type safety. Method doesn't exist on the repository. |
| `navigator.onLine` for connectivity | Web API. Replace with Android `ConnectivityManager`. |
| Russian console.log messages | All 30+ log calls in Russian. Remove or replace with structured logging. |
| `alert()` calls instead of `Alert.alert()` | Lines like `alert(t('errors.emptyFields'))` skip the native dialog API. |
| Hardcoded `registerDate = '2026-05-20'` | Fake date in ProfileScreen. Must come from server or account creation timestamp. |
| Hardcoded email `syverro.ris@gmail.com` | Contact info embedded in code. Should be configurable or removed. |
| `fetch("http://worldtimeapi.org")` (if present) | Unreliable external API for time. Use device clock. |

### Temporary Solutions

| Item | Reason |
|------|--------|
| `const fs: any = FileSystem` type bypass | Four files use this pattern to silence TypeScript. Must be properly typed. |
| Missing `change_queue` table creation | `changeQueueRepository` references a table that `database.ts` never creates. Runtime crash. |
| Missing `sync_state` table creation | Same issue. |
| Book schema missing 15+ fields | SQLite columns don't match the Book type. Data loss risk. |
| `GoogleSheetsService.d.ts` pointing to non-existent file | Dead ambient declaration. |
| `LanguageSelectorNew` component with no file extension | Unreachable. Has its own inline i18n duplicating the locale system. |
| `CustomDrawerContent.tsx` with no drawer navigator | Orphaned component. |
| `expo-speech` import never used | Imported in SessionScreen for voice input stub. Feature never implemented. |

### Technical Debt

| Item | Reason |
|------|--------|
| `any` types in 10+ files | Props, state, and store data untyped. Defeats TypeScript's purpose. |
| `type Quote = any` and `type Profile = any` in store/index.ts | TODO comment says "move to types/ when created" — type files already exist. |
| `quote.types.ts` vs `quotesSlice.ts` type mismatch | Type file defines 4 fields, slice defines 10. Inconsistent. |
| Inline `AnimatedBookCard` in LibraryScreen | 90-line component defined inside screen file. Not reusable. |
| `Animated.Value` cast `as any` for opacity | `BookCover.tsx` casts animated opacity to `any` to satisfy TypeScript. |
| `mode` reference in StatusFilters with no dark-mode differentiation | Variable is destructured but only used in a dead ternary. |
| Duplicated `formatDate` and `formatSessionTime` utility functions | Written independently in SessionScreen, QuotesScreen, Observations. |
| `||` fallback chains for every i18n call | `t('key') || 'Russian fallback'` pattern repeated 100+ times. |
| `setInterval` for orb animation (LightingContext) | Fires every 100ms unnecessarily. No functional purpose. |
| Module-level mutable `seenQuotesCache` array | Not in store state. Breaks time-travel debugging and state serialization. |
| Magic number `SYNC_INTERVAL = 10 * 60 * 1000` | Unconfigurable, no documentation. |
| Hardcoded `CARD_WIDTH = (width - 48 - 32) / 3` | Duplicated calculation. Assumes 3 columns always. |
| `importBooksFromSheets` returning error stub | Feature placeholder that returns `{ success: false, error: '...' }`. Remove or implement. |
| `migrateFromActiveBookId` migration code | Legacy data migration for a pre-prototype format. Remove for V1. |
| `react-native-axios-jwt` dependency | Listed in package.json but never used in any file. |
| `react-native-csv` dependency | Listed but never imported. |
| `react-native-worklets` dependency | Listed but never imported. |

### UI/UX to Remove

| Item | Reason |
|------|--------|
| Orb background animation | Decorative. 100ms interval. No user-facing value. Increases CPU usage. |
| LightingContext | Provides orb position, ambient tint, light intensity — but only orbPosition is consumed. Entire context is overhead for one visual effect. |
| BlurView (expo-blur) | Used only by OrbBackground. Remove with the orb. |
| Animated press effects on book cards | Nice-to-have. Not essential for V1. Can be added later. |
| GlassCard shadow with `elevation` | Android elevation is Material Design specific. Glass effect achieved differently in Compose. |
| Drawer navigation pattern | Prototype attempted a drawer but never wired it. V1 will use bottom tabs only. |
| "Quote of the day" random selection | Random display with no user value. Removed until deterministic algorithm exists. |
| Voice input stub | `startVoiceInput` shows an alert saying "under development". Remove until real implementation. |

---

## Migration Summary

| Layer | Expo Prototype | Kotlin Target |
|-------|---------------|---------------|
| Language | TypeScript / React | Kotlin / Jetpack Compose |
| State | Zustand (in-memory + SQLite) | Kotlin StateFlow + Room |
| Database | expo-sqlite (manual SQL) | Room (type-safe DAO) |
| Navigation | @react-navigation | Jetpack Navigation Compose |
| Networking | Axios / fetch | Retrofit + OkHttp |
| Auth | AsyncStorage token | EncryptedSharedPreferences |
| Sync | Mock stubs | Real Retrofit endpoints |
| Charts | victory-native | Compose Canvas |
| Animations | react-native-reanimated | Compose animation APIs |
| Theme | JS objects | Compose MaterialTheme + custom colors |
| i18n | JS objects with fallback | Android string resources + ICU |
| Timer | setInterval (Date.now()) | Coroutines + SystemClock |
| Forms | Inline, unvalidated | Compose form library + validation |
| Icons | @expo/vector-icons/Ionicons | Material Icons (Compose) |
| Fonts | expo-font | Android font resources (R.font) |
| Logging | console.log (Russian) | Timber / Logcat |
| Error handling | `.catch(console.error)` | Coroutine exception handlers + UI state |