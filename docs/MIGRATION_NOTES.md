# Syverro — Migration Notes: Expo Prototype → Native Android

## Status of the Expo Prototype

The Expo application in `mobile/` is a completed research prototype. It is **not** the codebase that will evolve into production. It serves as reference material for UX decisions, interaction patterns, and product concepts that were validated during Phase 1.

**Do not port code from the Expo prototype.**
**Do not attempt to upgrade the Expo project.**
**Do not treat it as a legacy codebase to be migrated incrementally.**

---

## What Survives from the Prototype

The following are extracted as documentation and will be rebuilt from scratch in Kotlin:

### Product Decisions
- All entries in `docs/PRODUCT_DECISIONS.md` are binding for V1.
- These describe *why* features work the way they do, not *how* they were implemented.

### UX Patterns
- All screen descriptions in `docs/UX_PATTERNS.md` define the target behavior.
- The Expo implementation is one interpretation; the Kotlin version may differ in implementation but must match the described user experience.

### Session Engine
- `docs/SESSION_ENGINE.md` defines the complete lifecycle.
- The timer, pause accumulation, and statistics derivation are rebuilt using Kotlin coroutines and `SystemClock.elapsedRealtime()`.

### Design System
- `docs/DESIGN_SYSTEM.md` defines colors, spacing, typography, and motion.
- The Jetpack Compose implementation will use `MaterialTheme` with these custom values rather than porting React Native StyleSheet objects.

### Database Schema
- `docs/DATABASE_SCHEMA.md` defines the Room entities, relations, indexes, and constraints.
- This is the target schema. The Expo prototye's SQLite schema is incomplete and incompatible.

---

## What Is Discarded

The following are removed entirely and should not be rebuilt:

| Item | Reason |
|------|--------|
| All Expo/React Native infrastructure | Platform change to Kotlin |
| Zustand store | Replaced by Room + StateFlow |
| `victory-native` charts | Replaced by Compose Canvas |
| Orb background / LightingContext | Decorative, no functional value |
| `syncAPI.ts` mock | Replaced by Retrofit calls to real endpoints |
| Stub store methods (sessions, quotes, profile) | Implemented properly via Room DAOs |
| `crypto.randomUUID()` workaround | Replaced by `java.util.UUID` |
| `navigator.onLine` connectivity check | Replaced by `ConnectivityManager` |
| `applyServerState()` cast to `any` | Properly typed method on Room DAO |
| Duplicate files (`bookService.ts`, `changeQueue.ts`) | Single implementation |
| Orphaned components (CustomDrawerContent, LanguageSelectorNew) | Never wired into navigation |
| Hardcoded Russian strings in console.log | Production logging removed |
| Voice input stub | Not implemented until proper speech integration |
| All prototype-specific `console.log` calls | Removed |

---

## Selective Feature Migration

Features from the prototype are evaluated individually for inclusion in V1:

| Feature | Migrate? | Notes |
|---------|----------|-------|
| Library grid (3-column) | Yes | Core UX |
| Search, filter, sort | Yes | Core UX |
| Book detail view/edit | Yes | Core UX |
| Reading session timer | Yes | Rebuilt with Kotlin coroutines |
| Quote capture | Yes | Core feature |
| Statistics (progress ring, charts) | Yes | Rebuilt with Compose Canvas |
| Profile with insights | Yes | Differentiator |
| Settings (theme, language, export) | Yes | Core UX |
| Dark/light theme | Yes | Redesigned as Compose theme |
| i18n (ru/en/be/ua) | Yes | Rebuilt as Android string resources |
| Favorites | Yes | Core UX |
| Book status workflow | Yes | Core UX |
| Active book concept | Yes | Core UX |
| Orb background animation | No | Decorative, removed |
| Lighting context | No | Only used by orb |
| Drawer navigation | No | Tabs-only in V1 |
| CSV import | No | Post-MVP |
| Google Sheets import | No | Discarded |
| Voice input | No | Post-MVP |
| Knowledge graph | No | Post-V1, belongs to Studio |
| Atmosphere taxonomy (browsing) | No | Post-V1 |
| Author pages | No | Post-V1 |
| Sync with server | No | Added in post-MVP milestone |

---

## Architecture Differences

| Aspect | Expo Prototype | Kotlin Target |
|--------|---------------|---------------|
| Language | TypeScript + React | Kotlin + Compose |
| State management | Zustand (central store) | Room (source of truth) + StateFlow (UI) |
| Database | expo-sqlite (raw SQL) | Room (annotated entities, DAOs) |
| Navigation | @react-navigation | Jetpack Navigation Compose |
| Networking | Axios (mock only) | Retrofit + OkHttp |
| Auth token storage | AsyncStorage (plain text) | EncryptedSharedPreferences |
| Background timer | setInterval (polling) | Coroutine + SystemClock.elapsedRealtime |
| Charts | victory-native (third-party) | Compose Canvas (first-party) |
| Animations | react-native-reanimated | Compose animation APIs |
| Icons | @expo/vector-icons/Ionicons | Material Icons (Compose) |
| Fonts | expo-font | Android font resources (R.font) |
| Error handling | .catch(console.error) | Coroutine exception handlers + sealed UI state |

---

## Build and Distribution

- **Prototype:** Expo Go / Expo APK (development only)
- **V1:** Native AAB via Google Play, target SDK 35, min SDK 29
- **No code sharing** between prototype and V1. Clean slate.

---

## Timeline Assumption

The migration described here is not a sequential port. It is a **clean rewrite informed by the prototype**. The prototype exists as a living specification — open it to verify behavior, but do not open it to copy code.