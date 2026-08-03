# Editorial Localization Layer — Architecture (Revision 4)

> Status: Final architecture review, corrected (Studio Review Iteration 3, revision 4)
> Scope: Design document only. No application code modified, no migrations created, no APIs
> implemented, nothing committed.
> Date: 2026-08-03

---

## 0. Revision summary (Rev. 3 → Rev. 4)

| Rev. 3 decision | Rev. 4 / final correction |
|---|---|
| `author_genres` junction in taxonomy normalization | **Removed.** Genres belong to Books/Works, not Authors. No Author→Genre canonical ownership, no `author_genres`, no duplicated author genre localization. Author genre profile is a *derived projection* from authored works only. |
| Author themes/motifs/concepts treated as author-owned taxonomy | **Constrained.** Author themes/motifs/concepts derived from works are a read-model projection, never a second source of truth. |
| Nationality / Language modeled as `KnowledgeNode` (`node_type='nationality'` / `'language'`) | **Deferred.** Not modeled as generic KnowledgeNodes. Current canonical fields are preserved and not migrated. Modeling requirements (ISO code, native name, direction, localized display names; identity-geography separation) are documented for a separate RFC. |
| Nationality/Language shown as resolvable references in the Studio contract | **Deferred** in the Studio contract; they resolve to canonical values until a dedicated domain model exists. |
| "Ready to implement" | **Scoped.** Implementation-ready for Slice 1 (place / knowledge-node / genre / author-owned-text localization + shared status/provenance conventions). Nationality, citizenship, language models, derived projections, quotes, sources, and long-form editorial are explicitly deferred. |
| Rollout: 1a normalization → 1b tables → backend → Studio → dict removal → 2/3/4 | **Revised.** Slice 1 = shared conventions + four localization tables; Slice 2 = public resolution + Studio editing + dict migration; Slice 3 = quotes + sources; separate future RFC for Language and nationality/citizenship/identity models. |

---

## 1. Problem statement

The UI language layer is complete (6 locales: `ru, en, kk, uk, be, sr`, default `ru`).
The remaining defect is **stored editorial content** — it is canonical-English-only, and the
public pages currently patch a handful of those values with **hardcoded frontend dictionaries**
(`web/src/pages/AuthorPage/index.tsx`, lines 184–539):

- `relationsLabelsEn/Ru`, `localPublicationTypeLabels` — presentational code→label maps.
- `nationalityMap`, `ethnicOriginMap`, `culturalIdentityMap`, `countryMap`, `literaryMovementMap`
  — **editorial content localizations hardcoded in a component**. The anti-pattern this design
  removes. They are EN→RU only (`kk/uk/be/sr` readers still see English), cover a small subset,
  and silently diverge from the data.

Verified live example (RU interface):

| Field | Stored (canonical, EN) | Displayed (RU interface) |
|---|---|---|
| cultural identity | `Victorian English literature` | patched via `culturalIdentityMap` |
| literary movements | `Victorian literature` | patched via `literaryMovementMap` |
| birth place | `Thornton, West Yorkshire, England` | assembled from `Place.*` + `countryMap` |
| death place | `Haworth, West Yorkshire, England` | assembled from `Place.*` + `countryMap` |

Everything else (bio, quotes, timeline, sources, publications, awards, citizenships, genres,
themes, motifs, concepts, atmospheres, knowledge entities) renders **verbatim in English**.

---

## 2. Read-only audit (accepted; targets corrected)

Legend: **B** = backend (no storage/API), **F** = frontend (patches or renders verbatim),
**B+F** = both. "Localized today?" = against current schema **and** public API.
"Deferred" = ownership confirmed but deliberately outside the first implementation slice.

### 2.1 Author scalar columns (`authors`)

| Field | Storage | Localized today? | Limiting | Owning entity → localization target |
|---|---|---|---|---|
| `name` / `first/last/middle_name` | `VARCHAR` | No (proper noun) | — | Out of scope; optional per-locale `display_name` later. |
| `native_name` | `VARCHAR` | Partial (one native script) | B | Canonical supplement; not a variant. |
| `nationality` | `VARCHAR` | No | **B+F** | **Deferred.** Canonical field preserved, not migrated. Dedicated Nationality entity required (see §4.10). No `KnowledgeNode` replacement. |
| `ethnic_origin` | `VARCHAR` | No | **B+F** | **Author** (author-owned editorial text) → `author_localizations.ethnic_origin`. |
| `cultural_identity` | `VARCHAR` | No | **B+F** | **Author** (author-owned editorial text) → `author_localizations.cultural_identity`. |
| `birth_place` / `death_place` | `VARCHAR` (snapshot) | No | **B+F** | Keep snapshot canonical; display resolved from **Place** → `place_localizations`. |
| `birth_place_id` / `death_place_id` | `UUID → places.id` | No | B | **Place** → `place_localizations`. |
| `pen_names` / `pseudonyms` | `ARRAY(String)` | No | — | Out of scope (names). |
| `occupations` | `ARRAY(String)` | No | B | Standard terms → **KnowledgeNode** (`node_type='occupation'`); free-form author-specific notes → `author_localizations` editorial text. |
| `languages` / `writing_languages` | `ARRAY(String)` | No | B | **Deferred.** Canonical fields preserved, not migrated. Dedicated Language entity required (see §4.10). No `KnowledgeNode` replacement. |
| `literary_movements` | `ARRAY(String)` | No | **B+F** | **KnowledgeNode** (`node_type='literary_movement'`, relation `belongs_to_movement`) → `knowledge_node_localizations.name`. |
| `genres` | `ARRAY(String)` | No | B | **Deferred as author-owned.** Genres belong to Books/Works (§4.8). No `author_genres`. Author genre profile is a derived projection. |
| `themes`, `motifs`, `concepts`, `atmospheres` | `ARRAY(String)` | No | B | **KnowledgeNode** (per `node_type`) → `knowledge_node_localizations.name`. When sourced from works, treated as a projection, not a second source of truth. |
| `bio` | `TEXT` | No | B | **Author** → `author_localizations.bio`. |
| `hero_quote` | `VARCHAR` | No | B | **Author** → `author_localizations.hero_quote`. |
| `about_summary` | `VARCHAR` | No | B | **Author** → `author_localizations.about_summary`. |
| `author_intro_quote` | `VARCHAR` | No | B | **Author** → `author_localizations.author_intro_quote`. |
| `portrait_caption` | `VARCHAR` | No | B | **Author** → `author_localizations.portrait_caption`. |
| `search_aliases` | `TEXT` | — | — | Search aid; out of scope (see §10 risks). |

### 2.2 Author child entities

| Entity | Field(s) | Storage | Localized today? | Limiting | Owning entity → target |
|---|---|---|---|---|---|
| `AuthorQuote` | `text`, `speaker` | `TEXT`/`VARCHAR` | No | B | **AuthorQuote** → `author_quote_localizations` (deferred, Slice 3) + `author_quotes.language`. |
| `Source` | `title`, `citation`, `notes` | `TEXT` | No | B | **Source** → `source_localizations` (deferred, Slice 3). |
| `AuthorPublication` | `title`, `description` | `TEXT` | No | B | **AuthorPublication** → `author_publication_localizations` (deferred). |
| `AuthorCitizenship` | `state_name`, `notes` | `VARCHAR` | No | B | **Deferred** (identity-geography RFC). |
| `AuthorAward` | `name`, `organization`, `work` | `VARCHAR` | No | B | **AuthorAward** → `author_award_localizations` (deferred). |
| `TimelineEvent` | `label`, `description` | `VARCHAR`/`TEXT` | No | B | **TimelineEvent** → `timeline_event_localizations` (deferred). |
| `TimelineEvent.place_id` | `place_name` resolved | `UUID → places` | No | B | **Place** → `place_localizations`. |
| `TimelineEvent.source_id` | `source_title` resolved | `UUID → sources` | No | B | **Source** → `source_localizations.title` (deferred). |

### 2.3 Knowledge entities

| Field | Storage | Localized today? | Limiting | Owning entity → target |
|---|---|---|---|---|
| `KnowledgeNode.name` | `VARCHAR` (canonical) | No | B | **KnowledgeNode** → `knowledge_node_localizations.name`. |
| `KnowledgeNode.description` | `TEXT` | No | B | **KnowledgeNode** → `knowledge_node_localizations.description`. |
| `KnowledgeNode.meta` | `JSONB` (unused for i18n) | No | B | Do **not** reuse for i18n (see §4.1). |
| `KnowledgeRelation.relation_type` | `VARCHAR` (code) | No (UI label only) | F | Presentational code; not editorial content. |

Public impact: `metadata.{genres,themes,motifs,concepts,atmospheres,literary_movements,languages}`
in `GoldenAuthorResponse` is derived from `KnowledgeNode.name` + author ARRAY columns — canonical EN
today. Array elements must resolve through the owning entity's ID (node / place), never through a
canonical string or positional author-array mapping. Elements derived from works are projections.

### 2.4 Places

| Field | Storage | Localized today? | Limiting | Owning entity → target |
|---|---|---|---|---|
| `name` | `VARCHAR` | No | B | **Place** → `place_localizations.name`. |
| `name_native` | `VARCHAR` | Partial (one native script) | B | Canonical supplement; keep. |
| `region`, `country` | `VARCHAR` | No | **B+F** | **Place** → `place_localizations.region/country`; delete `countryMap`. |
| `wikidata_id` | `VARCHAR` | — | — | Optional future multilingual lookup key. |

### 2.5 Genres & books

| Field | Storage | Localized today? | Limiting | Owning entity → target |
|---|---|---|---|---|
| `Genre.name` | `VARCHAR` (unique canonical) | No | B | **Genre** → `genre_localizations.name`. |
| `Genre.description` | `VARCHAR` | No | B | **Genre** → `genre_localizations.description`. |
| `Book.title`, `description`, `subtitle`, `series_name` | `VARCHAR`/`TEXT` | No | B | **Book** → `book_localizations` (deferred; title only if descriptive). |
| Author genre profile | — | derived | No | **Projection** from authored books' genres (via `book_genres`). Never a stored author-owned list. |

### 2.6 Limiting-factor summary (accepted)

- Backend is the hard limit for every piece of free text and every controlled value: no storage
  exists for any variant, and the public API serializes canonical only.
- Frontend is a secondary limit: `AuthorPage` hardcoded maps (`nationalityMap`,
  `ethnicOriginMap`, `culturalIdentityMap`, `countryMap`, `literaryMovementMap`) plus
  `formatPlace` string assembly are the only EN→RU localization shipping; they must be removed
  after backend resolution exists, or they will double-translate.
- `web/src/components/Studio/shared/editorialValue.ts` already defines the intended Studio contract
  (`localizations?: Record<locale, string>` with canonical fallback) but is currently a no-op
  pass-through (backend never sends `localizations`; only `PlaceSelector` consumes it).

---

## 3. Principles

### 3.1 Approved principles (unchanged)

1. Canonical values remain preserved; variants are strictly additive.
2. No machine translation anywhere in the stack.
3. No hardcoded frontend dictionaries of editorial content.
4. Editors manually curate localized variants in Studio.
5. Public pages resolve the active locale server-side.
6. All six supported locales remain possible.
7. Rollout is additive and staged.

### 3.2 Critical architectural principle — single ownership

**No first-class entity may duplicate localized values that belong to another first-class entity.**

- Localization must belong to the entity that owns the information.
- Other entities reference owning entities **by ID only**; they never copy localized values.

```text
GOOD                                        BAD

Author                                     AuthorLocalization
    birth_place_id                              birth_place_ru        -- duplicated
        |                                      genres_ru             -- duplicated
        v                                      nationality_ru         -- duplicated
    Place
        |
        v
    PlaceLocalization
```

The same rule applies to: **Place, Country, Language, Genre, KnowledgeNode, Literary Movement,
Nationality**, and any reusable graph entity.

Consequences enforced throughout this document:

- `author_localizations` holds **only author-owned editorial text** (about summary, editor
  description, cultural identity / ethnic origin when free-form author text, long-form prose).
  It holds **no** place/language/genre/knowledge-node values.
- Author identity controlled vocabulary is expressed as **references to owning entities** where a
  dedicated owning entity exists and is implementation-ready (KnowledgeNode for movements/themes/
  motifs/concepts/atmospheres/occupations; Place for geography; Genre via works).
- **Deferred domains** (nationality, citizenship, language, country/historical-state identity)
  keep their canonical fields; they are neither migrated nor given generic replacements until a
  dedicated domain model is approved.

### 3.3 Derived taxonomy is a projection, never a second source of truth

An author's genre/theme/motif/concept profile may be **derived** from authored Books/Works as a
read model or projection (e.g. `Author → authored → Book → classified_as → Genre`). Such projections:

- are computed at read time or materialized by a projection job;
- must never accept editor-curated values that contradict the underlying works;
- must never be written into the localization layer as if they were author-owned data;
- resolve localized display through the owning entity's localization tables, exactly as any other
  reference does.

**Derived author taxonomy must not become a second source of truth.**

---

## 4. Data model — ownership-based localization

### 4.1 Why the generic `localized_content(entity_type, entity_id, field, locale, value)` is rejected

Weaknesses (documented, as required):

- **No reliable foreign keys.** `entity_id` is a bare `UUID` with no FK — the DB cannot enforce
  referential integrity, cascade deletes, or `ON DELETE` behavior. An orphan or a mis-scoped ID
  silently breaks resolution.
- **String field identifiers.** `field = 'bio'` is untyped; a typo (`'bi0'`) yields a silent
  missing variant at runtime, and the set of valid fields is only enforced by convention.
- **Weak type validation.** Every value is `TEXT`; nothing distinguishes short labels from long
  prose, or a single value from an array.
- **Difficult moderation/provenance.** One row cannot cleanly carry per-field status/confidence/
  reviewer when several fields share a row; and per-row provenance for one field is over-engineered
  for another.
- **Schema drift risk.** Adding a localized field requires no schema change, which is precisely the
  problem: the layer silently accepts arbitrary `(entity_type, field)` pairs with no migration,
  no typed column, and no reviewable contract.
- **Ownership violation.** A polymorphic row keyed on a bare entity UUID would let any entity
  store another entity's values, defeating the single-ownership principle (§3.2).

**Decision:** not adopted. It may remain **only** for explicitly bounded secondary text fields
where a dedicated table is not justified — currently **none** qualify (§4.9).

### 4.2 Why canonical-string glossary and author-localization arrays are both rejected

- A canonical string is **not stable identity**: editors rename values; a glossary keyed on the
  exact canonical string breaks or silently forks on any rename.
- Author-localization arrays for controlled vocabulary **duplicate** the owning entity's data and
  require fragile positional (1:1 order) mapping to canonical arrays — any reorder/insertion
  corrupts the pairing.
- The correct key is the **owning entity's UUID** (`node_id`, `place_id`, `genre_id`, `author_id`,
  ...). Resolution traverses the reference; localization lives on the owner.

### 4.3 Who owns what (applied)

| Value class | Owning entity | Localization table | Status |
|---|---|---|---|
| Author editorial prose (bio, hero quote, about summary, intro quote, portrait caption, editor description, free-form cultural identity / ethnic origin) | `Author` | `author_localizations` | **Slice 1** |
| Place name / region / country / display labels | `Place` | `place_localizations` | **Slice 1** |
| Node name / description / aliases (literary movement, theme, motif, concept, atmosphere, occupation, person, work, ...) | `KnowledgeNode` | `knowledge_node_localizations` | **Slice 1** |
| Genre name / description | `Genre` | `genre_localizations` | **Slice 1** |
| Quote translated text + provenance | `AuthorQuote` | `author_quote_localizations` | Slice 3 |
| Source editorial text (descriptive title, citation, notes, editorial description) | `Source` | `source_localizations` | Slice 3 |
| Book title / description / subtitle / series | `Book` | `book_localizations` | Deferred |
| Publication / award / timeline text | respective child entity | its `*_localizations` | Deferred |
| Nationality | **Deferred** (dedicated entity) | — | Deferred RFC |
| Citizenship history | **Deferred** (dedicated entity) | — | Deferred RFC |
| Language / writing languages | **Deferred** (dedicated entity) | — | Deferred RFC |
| Author genre / theme / motif / concept profile | **Derived projection** from works | resolved via owning entities | Projection only |

### 4.4 Shared lifecycle & provenance conventions (all localization tables)

```
locale           VARCHAR(8)   NOT NULL   -- normalized: 'ru'|'en'|'kk'|'uk'|'be'|'sr'
status           VARCHAR(16)  NOT NULL DEFAULT 'draft'
                 -- draft | in_review | approved | rejected | deprecated
confidence       FLOAT                     -- 0..1; seed imports start at 0.5
translator_id    UUID         NULL REFERENCES users(id)
reviewer_id      UUID         NULL REFERENCES users(id)
reviewed_at      TIMESTAMPTZ  NULL
source_id        UUID         NULL REFERENCES sources(id)   -- attestation provenance
created_by       UUID         NULL REFERENCES users(id)
created_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
```

`status` is **row-level** (per entity+locale). Public API serves a value only when
`status = 'approved'` (§5). Draft/in-review/rejected values are visible in Studio only.
These conventions are shared by every localization table introduced in any slice.

### 4.5 Concrete schemas — Slice 1

**`place_localizations`**

```
id            UUID PK DEFAULT gen_random_uuid()
place_id      UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE
locale        VARCHAR(8)  NOT NULL
name          VARCHAR(255)
region        VARCHAR(255)
country       VARCHAR(255)
display_label VARCHAR(255)          -- optional editor-curated localized display label
-- + shared lifecycle/provenance conventions (§4.4)
UNIQUE (place_id, locale)
INDEX  ix_place_localizations_locale (locale)
INDEX  ix_place_localizations_status (status)
```

Public `formatPlace` composition (`place, region, country`) resolves each component from this
table; `places.name_native` stays canonical supplement.

**`knowledge_node_localizations`**

```
id            UUID PK DEFAULT gen_random_uuid()
node_id       UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE
locale        VARCHAR(8)  NOT NULL
name          VARCHAR(255)
description   TEXT
aliases       TEXT[]                -- localized alternate names/aliases
-- + shared lifecycle/provenance conventions
UNIQUE (node_id, locale)
INDEX  ix_knowledge_node_localizations_locale (locale)
INDEX  ix_knowledge_node_localizations_status (status)
```

Graph identity is preserved: `knowledge_nodes.slug` and canonical `name` are untouched; the
localized `name` is display-only (§10 risks). This table owns localized names for every supported
`node_type` (literary movement, theme, motif, concept, atmosphere, occupation, person, work, ...).
It does **not** cover nationality or language until those domains are modeled (§4.10).

**`genre_localizations`**

```
id            UUID PK DEFAULT gen_random_uuid()
genre_id      UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE
locale        VARCHAR(8)  NOT NULL
name          VARCHAR(255)
description   VARCHAR(1000)
-- + shared lifecycle/provenance conventions
UNIQUE (genre_id, locale)
INDEX  ix_genre_localizations_locale (locale)
INDEX  ix_genre_localizations_status (status)
```

**`author_localizations`** — one row per (author, locale). **Author-owned editorial text only.**

```
id                  UUID PK DEFAULT gen_random_uuid()
author_id           UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE
locale              VARCHAR(8)  NOT NULL
cultural_identity   TEXT          -- only when author-owned editorial text (not taxonomy)
ethnic_origin       TEXT          -- only when author-owned editorial text (not taxonomy)
about_summary       TEXT
editorial_description TEXT        -- editor-authored description of this author entry
bio                 TEXT
hero_quote          TEXT
author_intro_quote  TEXT
portrait_caption    TEXT
-- + shared lifecycle/provenance conventions (§4.4)
UNIQUE (author_id, locale)
INDEX  ix_author_localizations_locale (locale)
INDEX  ix_author_localizations_status (status)
```

Notes:
- No `nationality`, `languages`, `genres`, `literary_movements`, `themes`, `motifs`, `concepts`,
  `atmospheres`, `occupations` columns. Those belong to their owning entities or are deferred.
- If `cultural_identity`/`ethnic_origin` are later modeled as taxonomy references instead of
  free-form text, ownership transfers to the referenced entity (per §3.2) and the column is
  dropped from this table.
- `nationality` and `languages` are **not** represented here at all; they remain canonical fields
  until the dedicated domain RFC (§4.10) resolves their model.

### 4.6 Quotes — dedicated table with full translation provenance (deferred, Slice 3)

Design is recorded here for the RFC; **not** implemented in Slice 1.

`author_quote_localizations`:

```
id                      UUID PK DEFAULT gen_random_uuid()
quote_id                UUID NOT NULL REFERENCES author_quotes(id) ON DELETE CASCADE
locale                  VARCHAR(8)  NOT NULL
translated_text         TEXT NOT NULL
translator              VARCHAR(255)             -- attribution, free text ("Editorial team, 2026")
translation_source_id   UUID NULL REFERENCES sources(id) ON DELETE SET NULL
                       -- the published edition/web source that attests this translation
-- + shared lifecycle/provenance conventions
UNIQUE (quote_id, locale)
INDEX  ix_author_quote_localizations_locale (locale)
INDEX  ix_author_quote_localizations_status (status)
```

Original text and original language are preserved **separately**:

- `author_quotes.text` — canonical original text, untouched.
- `author_quotes.language` — **new canonical column** (`VARCHAR(8)` NULL) recording the original
  language (e.g. `en`, `fr`). This must not be conflated with `sources.language` (the *source's*
  language) nor with target `locale`.

Translation fidelity is guaranteed by the workflow: `translated_text` is created/attested by a
human translator, tagged with `translator` + optional `translation_source_id`, and only served
publicly after `approved`.

### 4.7 Sources — selective localization (deferred, Slice 3)

Design is recorded here for the RFC; **not** implemented in Slice 1.

Source fields are **not equivalent**. Classification:

| Field | Class | Localized? |
|---|---|---|
| `url` | Technical identifier | **Never** localize. |
| `source_type` | Enum code | **Never** localize (frontend maps code→label). |
| `language` | Metadata of the source | **Never** localize (records source language). |
| `reliability_score`, `source_origin` | Metadata | **Never** localize. |
| `title` | Bibliographic identity | **Localize only if descriptive.** A proper-noun bibliographic title (publisher/edition identity) stays canonical; only a *descriptive* title may carry a display variant. |
| `citation` | Display form of the reference | Localizable (display-only; canonical citation retained). |
| `notes` | Internal/editorial annotation | Localizable. |
| `editorial_description` | Editorial annotation (new concept) | Localizable; intentionally distinct from `citation`. |

`source_localizations`:

```
id                      UUID PK DEFAULT gen_random_uuid()
source_id               UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE
locale                  VARCHAR(8)  NOT NULL
title                   VARCHAR(500)   -- descriptive-title variant only (§4.7 policy)
citation                TEXT
notes                   TEXT
editorial_description   TEXT
-- + shared lifecycle/provenance conventions
UNIQUE (source_id, locale)
INDEX  ix_source_localizations_locale (locale)
INDEX  ix_source_localizations_status (status)
```

`SourceLocalization` owns **only localizable editorial text**. It must not duplicate canonical
bibliographic identity (`url`, publisher/edition identity, `source_type`).

### 4.8 Reference normalization and genre ownership

Author identity controlled vocabulary is currently stored as denormalized strings on `authors`.
Correction applied:

1. **Genres belong to Books/Works, not Authors.** Canonical structure:
   `Author → authored → Book/Work → classified_as → Genre`. There is **no** `author_genres`
   junction, no manually curated Author→Genre canonical ownership, and no duplicated author genre
   localization. An author genre profile is derived from authored works as a projection (§3.3).
2. **Literary movements / themes / motifs / concepts / atmospheres** — node-backed via
   `AuthorKnowledgeRelation`; ensure every term has a `KnowledgeNode` and a relation row. Legacy
   `authors.*` ARRAY columns become canonical fallback only, then are deprecated. Where these are
   derived from works, they are projections, not second sources of truth.
3. **Occupations** — standard labels as `KnowledgeNode` (`node_type='occupation'`); free-form
   author-specific occupation notes may stay as `author_localizations` editorial text.
4. **Nationality and Language — deferred.** Canonical fields are preserved; nothing is migrated;
   no `KnowledgeNode` replacements are created. See §4.10.
5. Once references exist, the public API resolves each array element through its owning entity's
   localization with canonical fallback — no localized author arrays, no positional mapping.

### 4.9 Bounded secondary text — generic table decision

The generic polymorphic table is permitted **only** for explicitly bounded secondary text fields
with a documented justification. Current candidates (`AuthorResidence.notes`, `TimelineEvent`
long descriptions) are **not** justified: each belongs to a first-class entity that already gets a
dedicated table. Therefore **no generic table is created**. If a genuinely orphan, low-moderation
text field appears later, the decision gate is: stable entity? → dedicated table; otherwise →
bounded generic table with a fixed allowlist.

### 4.10 Deferred domain models (separate RFC)

The following are **not** modeled by this RFC and must not be represented as generic KnowledgeNode
types. Modeling requirements are documented here so the future RFC starts from explicit needs.

**Language (likely a dedicated canonical entity):**

- stable UUID identity;
- ISO 639-1 / 639-2 / 639-3 code;
- native name (endonym);
- text direction (LTR/RTL/bidirectional);
- localized display names (per supported locale);
- distinct from "writing languages" of an author and from `sources.language`.

**Identity geography — keep separate concepts, do not merge into one taxonomy node:**

- nationality;
- citizenship history (time-bounded, from/to dates — already partially modeled by
  `author_citizenships` with `from_date`/`to_date`/`notes`);
- country / historical state (may relate to `Place`, but historical states need lifecycle/era
  handling);
- ethnic origin;
- cultural identity;
- cultural region.

**Explicit decision:** until the dedicated RFC is approved, `authors.nationality` and
`authors.languages` / `authors.writing_languages` are canonical, English-only, and localized only
through the legacy frontend maps (which remain in place for these fields, see §7). They are not
migrated, not duplicated into `author_localizations`, and not given generic node replacements.

---

## 5. Fallback semantics

Resolution is per `(entity_id, field, requested_locale)`:

```
requested locale
  → approved localized value for requested_locale
  → canonical value (owning entity.<field>)
```

Precise rules:

1. **Draft / in_review / rejected / deprecated** rows are **never** served by the public API;
   Studio shows them for editing. "Approved localized value" = row present **and** `status='approved'`
   **and** field value non-empty.
2. **Missing variant** (no row for the locale, or row exists but field null) → canonical value.
3. **No cross-locale fallback** by default: `kk` does *not* fall back to `ru`. Canonical is the
   single fallback. A configurable `fallback_locales` chain is deferred (see risk §10.4).
4. **Locale normalization:** lowercase BCP-47 tags, restricted to the six supported values. Unknown
   or unparsable locale → canonical only.
5. **Place composition** uses the same rule per component (`name`, `region`, `country`) before
   joining; a component missing a variant keeps its canonical part (never an empty hole).
6. **Reference-based taxonomy:** an author's `literary_movements` (etc.) is resolved per element
   through the owning entity's approved localization, then canonical name; a referenced entity with
   no approved variant contributes its canonical name. Never a mix of localized and canonical
   within one element.
7. **Deferred fields** (`nationality`, `languages`) resolve to canonical values in Slice 1; they
   join the localization fallback chain only after their dedicated domain RFC.
8. Public responses echo the resolved `locale` so clients can display the source of truth if needed.

---

## 6. API contracts — public vs Studio (separate surfaces)

### 6.1 Public API (read-only, approved-only, no translation on client)

`GET /api/authors/{slug}?locale=ru` (locale may also come from `Accept-Language`; default `ru`).

- **Response shape is unchanged** (`GoldenAuthorResponse`). Field names carry localized text;
  the frontend renders opaque strings.
- Returns **only approved** values with canonical fallback (§5).
- No status/confidence/provenance metadata is exposed publicly.
- Adds a top-level `locale` echo.
- Taxonomy arrays (`metadata.*`, `occupations`, `literary_movements`) are resolved through
  owning-entity references, element-wise, preserving order.
- Deferred fields (`nationality`, `languages`) are returned canonical (Slice 1).

Books: same treatment on `compose_public_book_detail` (title/description/series where localized).

### 6.2 Studio API (full fidelity, per-locale editing)

Read — `GET /api/admin/{entity}/{id}/localizations?locale=all` returns canonical **and** every
variant with full metadata, e.g. for author:

```json
{
  "id": "…",
  "canonical": {
    "about_summary": "…",
    "cultural_identity": "Victorian English literature",
    "bio": "…"
  },
  "localizations": {
    "ru": {
      "cultural_identity": { "value": "викторианская английская литература", "status": "approved", "confidence": 0.95, "translator_id": "…", "reviewer_id": "…", "reviewed_at": "…", "source_id": null, "updated_at": "…" },
      "about_summary": { "value": "…", "status": "draft", "confidence": 0.5, "translator_id": "…", "reviewer_id": null, "reviewed_at": null, "source_id": null, "updated_at": "…" }
    }
  },
  "references": {
    "literary_movements": [
      { "node_id": "…", "canonical_name": "Victorian literature", "approved_name_ru": "викторианская литература" }
    ],
    "occupations": [
      { "node_id": "…", "canonical_name": "…", "approved_name_ru": "…" }
    ]
  }
}
```

Read for `place`, `knowledge_node`, `genre` follows the same shape (canonical + `localizations` +
optional `references`). `nationality` and `languages` are **not** exposed as localizable references
in this contract until the dedicated domain RFC.

Write — `PUT /api/admin/{entity}/{id}/localizations/{locale}` accepts an explicit locale and an
object of `{ field: value }` plus optional `translator`, `translation_source_id`, `confidence`,
`status`. Canonical fields and **references** are edited through their owning-entity endpoints
(e.g. link/unlink `knowledge_node` from author) — never through a localization write.

Entity endpoints: `author` (author-owned text), `place`, `knowledge_node`, `genre` in Slice 1;
`author_quote`, `source` in Slice 3; Slice-4 entities later. The existing `editorialValue.ts`
contract (`localizations: Record<locale, value>`) is generalized to carry the metadata object above.

### 6.3 Explicit separation rationale

Public consumers need a single, flat, already-resolved string. Studio editors need canonical +
all variants + status + provenance. Forcing both into one shape either leaks editorial state
publicly or starves Studio of metadata. Two contracts, two response models, one storage layer.

---

## 7. Frontend changes — remove hardcoded dictionaries safely

### 7.1 Inventory of `AuthorPage/index.tsx`

| Constant | Kind | Content | Disposition |
|---|---|---|---|
| `nationalityMap` | EN→RU editorial | ~46 entries | **Deferred.** Keep in place until the Nationality domain RFC; import into the dedicated entity once it exists. |
| `ethnicOriginMap` | EN→RU editorial | ~20 entries | **Import → review → delete** (Slice 2) → `author_localizations.ethnic_origin`. |
| `culturalIdentityMap` | EN→RU editorial | ~7 entries | **Import → review → delete** (Slice 2) → `author_localizations.cultural_identity`. |
| `countryMap` | EN→RU editorial | ~13 entries | **Import → review → delete** (Slice 2) → `place_localizations.country`. |
| `literaryMovementMap` | EN→RU editorial | ~31 entries | **Import → review → delete** (Slice 2) → `knowledge_node_localizations.name` for literary-movement nodes. |
| `relationsLabelsEn/Ru` | code→label | presentational | Keep (interface concern; migrate into `locales/*` when convenient). |
| `localPublicationTypeLabels` | code→label | presentational | Keep (same). |

`formatPlace` and `localizeField` dictionary paths are deleted once the maps they serve are gone.

### 7.2 Import → review → delete procedure

1. **Extract** each editorial map into a seed dataset keyed by canonical term.
2. **Route** each term to its owning entity:
   - `ethnicOriginMap` / `culturalIdentityMap` → `author_localizations.ethnic_origin` /
     `cultural_identity` (RU) for every author whose canonical value matches.
   - `countryMap` → `place_localizations.country` (RU) for every `places` row whose canonical
     `country` matches.
   - `literaryMovementMap` → `knowledge_node_localizations.name` (RU) for matching literary-movement
     `knowledge_nodes` (by canonical name) already linked to authors via `belongs_to_movement`.
   - `nationalityMap` → **not imported in this RFC**; retained until the Nationality domain RFC.
3. **Seed** rows with `status='draft'`, `confidence=0.5`, `translator_id=<import system user>`,
   `source_id=NULL`, `created_by=<import system user>`.
4. **Review:** editors approve seeded rows through the normal Studio moderation workflow (set
   `reviewer_id`, `reviewed_at`, `status='approved'`). Only approved rows affect public output.
5. **Delete per-field:** a map is removed from `AuthorPage` **only after** its terms are imported,
   reviewed, and served by the API for the RU locale — checked field-by-field to avoid a regression
   window where the map was the only localizer.
6. Public pages then request `?locale=<active>`; the frontend renders the payload verbatim with no
   translation logic. `editorialValue.ts` becomes the real Studio resolver.

---

## 8. Implementation scope (scoped readiness)

### 8.1 Approved implementation scope (Slice 1)

- `place_localizations`
- `knowledge_node_localizations`
- `genre_localizations`
- trimmed `author_localizations` for author-owned editorial text
- shared localization status/provenance conventions (§4.4)
- public locale resolution with canonical fallback
- Studio localization read/write contracts for the four entities

### 8.2 Deferred (explicitly out of scope for Slice 1)

- nationality canonical model and localization
- citizenship history model and localization
- language canonical model and localization
- author-derived genre/theme projection materialization
- quote localization (`author_quote_localizations`)
- source localization (`source_localizations`)
- long-form editorial localization beyond the trimmed `author_localizations` fields
- Book / publication / award / timeline localization

---

## 9. Rollout order

**Slice 1** (implementation-ready):
1. Schema: `place_localizations`, `knowledge_node_localizations`, `genre_localizations`,
   `author_localizations` with shared status/provenance conventions. No behavior change.
2. Backend: public locale resolution with canonical fallback; Studio `localizations` read/write
   for the four entities. Feature-flag the resolver initially.
3. Studio UI: generalize `editorialValue.ts`; per-locale editors for author-owned text, places,
   nodes, genres.

**Slice 2**:
4. Wire requested locale into public calls; delete migrated frontend EN→RU dictionaries
   (`ethnicOriginMap`, `culturalIdentityMap`, `countryMap`, `literaryMovementMap`) after import +
   review + approval. `nationalityMap` stays until the Nationality RFC.
5. Validate all six locales, no double translation, canonical intact.

**Slice 3**:
6. Quote translations (`author_quote_localizations` + `author_quotes.language`).
7. Source localizations (selective, §4.7).

**Separate future RFC:**
8. Language model (ISO codes, native name, text direction, localized display names).
9. Nationality / citizenship / country & historical-state / identity-geography model.

---

## 10. Risks

1. **Duplicate translations (ownership).** Eliminated by construction for all reusable values — a
   term's translation lives once on its owning entity. Residual risk is only legacy author ARRAY
   columns that duplicate node data; mitigated by node normalization and deprecation of the legacy
   columns. Genre/theme projections (§3.3) cannot reintroduce duplication because they are read-only
   projections resolved through owning entities.
2. **Locale normalization.** Drift between `RU`/`ru`/`ru-RU` breaks `UNIQUE(entity_id, locale)`.
   Enforced by a single normalization helper + CHECK on `locale IN (...)`; unknown locales rejected
   at write time.
3. **Canonical-value renaming.** Renaming a canonical `KnowledgeNode.name` / `Genre.name` / `Place.name`
   must not invalidate variants: keying on entity ID makes variants survive renames. No positional
   author-array mapping exists, so no ordering hazard remains.
4. **Fallback ambiguity.** Without the "approved-only" rule, draft translations could leak publicly;
   without "no cross-locale fallback", kk pages would silently show ru. Both are pinned in §5.
   Future `fallback_locales` must be explicit per locale and reviewed.
5. **Search/indexing.** `AuthorsPage` search matches canonical `name`/`nationality`; localized
   values won't be searchable until the search layer indexes variants (via owning entities). Flagged
   for a follow-up; not a blocker for display.
6. **Graph identity preservation.** `knowledge_nodes.name` is canonical identity for graph edges
   and slugs. Localized `name` is display-only; `slug` and canonical `name` are never rewritten by
   the localization layer. Any display-side dereference must still route through `node_id`.
7. **Moderation workflow.** Row-level `status` + `reviewer_id`/`reviewed_at` + `change_log`
   integration is required so every approved variant is auditable. The seed import (`translator_id`
   = import user, `confidence` = 0.5) must be visible as draft so it cannot bypass review.
8. **Migration of existing hardcoded RU dictionaries.** The maps are global, not per-entity; import
   must fan out to the right owning entities (authors, places, literary-movement nodes) and must be
   reversible. Deletion is per-field and gated on approved coverage (§7.2.5); the presentational
   code→label maps stay; `nationalityMap` stays pending the Nationality RFC.
9. **Quote translation fidelity.** `author_quote_localizations.translated_text` is editorial/authorial;
   never auto-derived, always carries `translator` + optional `translation_source_id`, gated on
   approval. `author_quotes.language` must be populated as data, not guessed.
10. **Schema drift.** Dedicated tables force an explicit migration per localized field; this is the
    intended governance trade-off vs. the rejected generic table. Field additions follow the normal
    Alembic review path.
11. **Deferred-domain regression risk.** While `nationality`/`languages` remain canonical-only,
    their localized display depends on the legacy `nationalityMap`. Removing it prematurely would
    regress RU display. This is why the map is explicitly retained until the Nationality RFC (§7.1).
12. **Projection drift.** Author genre/theme profiles derived from works can drift from the works
    they are derived from. The projection must be recomputed on work classification changes and must
    never accept editor-curated contradicting values (§3.3).

---

## 11. Ownership Matrix (implementation reference)

For every localizable field: **owning entity** (single owner), **localization table**, **referenced
by** (who points at it), **fallback source** (what the public resolver returns when no approved
variant exists). Canonical columns are never modified by the localization layer.

### 11.1 Author-owned editorial text — `author_localizations` (Slice 1)

| Field | Owning entity | Localization table | Referenced by | Fallback source |
|---|---|---|---|---|
| `bio` | `Author` | `author_localizations.bio` | `AuthorPage` biography modal | `authors.bio` |
| `hero_quote` | `Author` | `author_localizations.hero_quote` | `AuthorPage` hero | `authors.hero_quote` |
| `about_summary` | `Author` | `author_localizations.about_summary` | `AuthorPage` hero/about | `authors.about_summary` |
| `author_intro_quote` | `Author` | `author_localizations.author_intro_quote` | `AuthorPage` | `authors.author_intro_quote` |
| `portrait_caption` | `Author` | `author_localizations.portrait_caption` | media/gallery UI | `authors.portrait_caption` |
| `editorial_description` | `Author` | `author_localizations.editorial_description` | Studio / public about (new) | none (no canonical column yet) |
| `cultural_identity` | `Author` (author-owned editorial text) | `author_localizations.cultural_identity` | `AuthorPage` metadata | `authors.cultural_identity` |
| `ethnic_origin` | `Author` (author-owned editorial text) | `author_localizations.ethnic_origin` | `AuthorPage` metadata | `authors.ethnic_origin` |

> Rule: if `cultural_identity`/`ethnic_origin` become taxonomy references, ownership transfers to
> the referenced entity and these rows move out of `author_localizations`.

### 11.2 Place — `place_localizations` (Slice 1)

| Field | Owning entity | Localization table | Referenced by | Fallback source |
|---|---|---|---|---|
| `name` | `Place` | `place_localizations.name` | `authors.birth_place_id`, `authors.death_place_id`, `timeline_events.place_id`, `knowledge_nodes.place_id` | `places.name` |
| `region` | `Place` | `place_localizations.region` | `formatPlace` composition | `places.region` |
| `country` | `Place` | `place_localizations.country` | `formatPlace` composition | `places.country` |
| `display_label` | `Place` | `place_localizations.display_label` | `PlaceSelector`, timeline chips | `places.name` |

### 11.3 KnowledgeNode — `knowledge_node_localizations` (Slice 1)

| Field | Owning entity | Localization table | Referenced by | Fallback source |
|---|---|---|---|---|
| `name` | `KnowledgeNode` | `knowledge_node_localizations.name` | `AuthorKnowledgeRelation`, `BookKnowledgeRelation`, graph edges, author taxonomy arrays (via relation), `metadata.*` | `knowledge_nodes.name` |
| `description` | `KnowledgeNode` | `knowledge_node_localizations.description` | node detail UI, explorer | `knowledge_nodes.description` |
| `aliases` | `KnowledgeNode` | `knowledge_node_localizations.aliases` | search/display | none |

Covers `node_type` values: literary_movement, theme, motif, concept, atmosphere, occupation,
person, work, etc. Does **not** cover nationality or language (deferred, §4.10).

### 11.4 Genre — `genre_localizations` (Slice 1)

| Field | Owning entity | Localization table | Referenced by | Fallback source |
|---|---|---|---|---|
| `name` | `Genre` | `genre_localizations.name` | `book_genres` (works), author genre **projection** | `genres.name` |
| `description` | `Genre` | `genre_localizations.description` | genre detail UI | `genres.description` |

> Authors do not own genres. The author genre profile is a derived projection from authored works
> (§3.3); it resolves localized names through this table and is never stored author-side.

### 11.5 AuthorQuote — `author_quote_localizations` (deferred, Slice 3)

| Field | Owning entity | Localization table | Referenced by | Fallback source |
|---|---|---|---|---|
| `translated_text` | `AuthorQuote` | `author_quote_localizations.translated_text` | `AuthorPage` quotes | `author_quotes.text` |
| `translator` | `AuthorQuote` | `author_quote_localizations.translator` | Studio moderation | none |
| `translation_source_id` | `AuthorQuote` | `author_quote_localizations.translation_source_id` | provenance/audit | none |
| original language | `AuthorQuote` | `author_quotes.language` (new canonical col) | display/selection | none (data entry) |

### 11.6 Source — `source_localizations` (deferred, Slice 3)

| Field | Owning entity | Localization table | Referenced by | Fallback source |
|---|---|---|---|---|
| `title` (descriptive only) | `Source` | `source_localizations.title` | timeline/quote `source_title` resolution | `sources.title` |
| `citation` | `Source` | `source_localizations.citation` | references display | `sources.citation` |
| `notes` | `Source` | `source_localizations.notes` | Studio | `sources.notes` |
| `editorial_description` | `Source` | `source_localizations.editorial_description` | Studio / public (new) | none |
| `url`, `source_type`, `language`, `reliability_score`, `source_origin` | `Source` | **not localizable** (canonical bibliographic identity/metadata) | — | canonical only |

### 11.7 Deferred child entities (own their text; not reusable graph entities)

| Field | Owning entity | Localization table | Referenced by | Fallback source |
|---|---|---|---|---|
| `label`, `description` | `TimelineEvent` | `timeline_event_localizations` | `AuthorPage` timeline | `timeline_events.label/description` |
| `title`, `description` | `AuthorPublication` | `author_publication_localizations` | bibliography UI | `author_publications.title/description` |
| `name`, `organization`, `work` | `AuthorAward` | `author_award_localizations` | awards UI | `author_awards.*` |
| `title`, `description`, `subtitle`, `series_name` | `Book` | `book_localizations` | `BookPage` | `books.*` (title localized only if descriptive) |

### 11.8 Deferred domains — no localization table yet

| Field | Current owner | Status | Fallback source |
|---|---|---|---|
| `authors.nationality` | `Author` (canonical) | Deferred — dedicated Nationality entity RFC | canonical + legacy `nationalityMap` |
| `authors.languages` / `writing_languages` | `Author` (canonical) | Deferred — dedicated Language entity RFC | canonical |
| `author_citizenships.*` | `AuthorCitizenship` (canonical) | Deferred — identity-geography RFC | canonical |

### 11.9 Explicitly non-localized (canonical identity)

| Field | Owning entity | Reason |
|---|---|---|
| `authors.name` / name parts, `pen_names`, `pseudonyms`, `native_name` | `Author` | Proper nouns / names; no variant layer. |
| `knowledge_nodes.slug`, canonical `name` | `KnowledgeNode` | Graph identity; localized `name` is display-only. |
| `genres.name`, `genres.slug` | `Genre` | Dimension identity; localized name display-only. |
| `source.url`, `source_type`, `language`, reliability/origin | `Source` | Technical/metadata. |
| `author_quotes.text` | `AuthorQuote` | Original text preserved verbatim; only `translated_text` localizes. |
| `places.wikidata_id` | `Place` | Identifier. |

---

## Appendix — Files referenced by the audit

| File | Role |
|---|---|
| `backend/app/models/author.py` | Canonical author columns (all EN). |
| `backend/app/models/{author_quote,source,author_publication,author_award,timeline_event,author_citizenship}.py` | Child entities, no localization. |
| `backend/app/models/{knowledge_node,place,genre,book,author_knowledge_relation}.py` | Knowledge entities, places, genres, books, author→node relations. |
| `backend/app/schemas/author.py` | `GoldenAuthorResponse` — public shape (unchanged by §6.1). |
| `backend/app/api/authors.py` | Public serialization; canonical values + `place_map` by `Place.name`. |
| `web/src/pages/AuthorPage/index.tsx` | Hardcoded editorial maps + `formatPlace` (§7 inventory). |
| `web/src/components/Studio/shared/editorialValue.ts` | Studio localized-resolver contract to be generalized. |
| `web/src/locales/{types,en,ru,uk,be,kk,sr}.ts` | Interface strings only (6 locales). |
