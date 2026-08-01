# ADR: Sapphire — Independent Knowledge Entity Architecture

**Status:** Accepted
**Date:** 2026-08-01
**Scope:** The Sapphire curated layer — the model governing how a curated work and its author carry editorial knowledge.

---

## Context

Syverro's catalog has historically been organized around records: a book is a row with fields, an author is a row with fields, and genres are a closed list attached to books. This structure treats classification as a *property of the record* rather than as a *relationship in a network of knowledge*. The product vision treats a book as a node, not a card — an entry point into a graph of ideas, themes, concepts, places, and experiences.

The Sapphire initiative exists to curate a small set of deeply understood works and authors. A Sapphire object carries the full weight of editorial knowledge, in contrast to a catalog entry, which carries only bibliographic facts. Before building any reader-facing surface (Explorer, Reading Mode) or expanding the entity model, the architecture had to be proven and frozen. This record documents the design decisions behind Sapphire and what was validated.

---

## Decisions

### 1. Knowledge Entities were introduced as the unit of editorial knowledge

Classification data — a genre, a theme, a motif, a concept, a place, a language, a timeline event — is not a field on a book. It is a **knowledge entity**: a typed, named, described, independent object with its own lifecycle.

The reasons:

- **Reuse.** A concept like *Self-determination* or a place like *England* is shared across works and authors. A field on a single record cannot be shared; an independent object can.
- **Typing.** Knowledge has distinct kinds. A genre, a theme, and a place are different in kind, carry different descriptions, and will be consumed differently by future surfaces. The entity type preserves that distinction.
- **Lifecycle.** Editorial knowledge is drafted, reviewed, and published. Embedding it in a book's fields conflates *the work* with *the knowledge about the work* and makes moderation impossible to separate.
- **Future-proofing.** Explorer, Reading Mode, and discovery all consume typed knowledge, not denormalized fields.

### 2. Books are the semantic center of the curated layer

A work is where knowledge converges. The book is the anchor of a Sapphire pair, and every piece of editorial knowledge about the work is expressed as a **typed relation from the book** to a knowledge entity.

Why the book is central:

- The book is the concrete object people actually encounter. It is the natural entry point for a reader and the natural unit of curation.
- Everything a work "knows" — its literary taxonomy, themes, motifs, concepts, places, languages, timeline — flows through it.
- Curating a book *first* forces the editorial knowledge to be grounded in a real object before it is generalized into shared entities. This is why the curation workflow begins with the work.

### 3. Authors contain only intrinsic person data

An author record describes a *person*: names and pseudonyms, portrait, biography, dates, places of birth and death, nationality, occupations, languages, personal quotes, bibliography.

The person is not defined by any single work, and works are not extensions of the person. Separating the two preserves accuracy (one person, many works) and prevents the writer from being conflated with the writing. A genre a person once wrote in is not a property of the person; it is a property of the specific works where it actually appears.

### 4. Taxonomy belongs to Works, not to Authors

Genres, literary movements, themes, motifs, concepts, and atmospheres describe *works*. When attached to an author they are wrong in two ways: they mislabel the person, and they cannot represent *which* works carry which classification. A relation from an author to a genre implies the whole person is of that genre — a statement that is never true.

Therefore work-level taxonomy is expressed exclusively as relations from books. The author participates in the knowledge graph only through intrinsic facts and through the works they wrote.

### 5. Knowledge Entities are independent first-class objects

An entity carries no implicit owner. It exists in the library of reusable knowledge objects. Relations connect it outward, but no entity exists *because of* a book or an author.

The consequences of independence:

- **No reverse references.** A relation from a book to an entity never implies a hidden relation from the entity back to the book. The graph is honest.
- **Deletion safety.** Removing a relation never removes the entity. An editor can detach an entity without destroying a shared object.
- **Standing alone.** An entity may legitimately exist with zero relations — created in anticipation of use, or holding value beyond any single work.
- **One source of truth.** A single entity is referenced by many books; there is never a duplicated theme or genre shadowing another.

### 6. Vocabulary emerges through editorial curation, not predefined taxonomies

There is no machine-readable inventory of canonical genres, themes, or places, and no predefined hierarchy dictating what may exist. At the moment a work needs a concept, an editor **creates or reuses** an entity through curation.

Why this is the right order:

- Vocabulary grows from the material, not from a spec. The catalog defines the taxonomy, never the reverse.
- It prevents premature, speculative taxonomy — no hundreds of empty categories waiting for a book that may never come.
- Reuse stays natural: an editor attaches an existing entity when it fits and creates one only when the catalog genuinely lacks it.
- The editorial act — "this work needs a concept that does not exist yet" — is itself valuable signal for the future entity model.

### 7. This phase intentionally avoided UI automation

No create-on-the-fly pickers, no bulk curation tooling, no automation inside the editor was built this phase. The workflow was deliberately executed through the existing, minimal curation surface.

Why:

- The goal of the phase was to prove the **architecture**, not to build convenience.
- Automation is only valuable once the model it automates is known to be correct. Building tooling around an unproven model would have optimized the wrong thing.
- Doing the first pair "by hand" surfaced exactly the kind of friction that design documents cannot predict — and that is precisely what the phase was meant to reveal.

---

## Validation: Charlotte Brontë + Jane Eyre

A complete Sapphire pair was curated end-to-end against the frozen architecture, using a work that did not previously exist in the curated catalog. The following architectural assumptions were successfully validated:

- **The whole pair can be expressed within the model.** The work was created and enriched, and nineteen knowledge relations were attached across genres, a literary movement, a place, a timeline event, a language, themes, motifs, and concepts. Nothing about the pair required a change to the architecture.
- **Reuse and creation coexist cleanly.** Shared entities that already existed (for example the Bildungsroman genre, the Victorian literature movement, the English language) were attached without being altered. New entities (for example the Gothic Novel genre, the motif *Fire*, the concept *Governess*) were created independently and attached. Reused and created entities are indistinguishable from the work's perspective — which is the correct behavior.
- **Entity independence holds.** Every newly curated entity is referenced only by the work being curated; no implicit or reverse relations exist, and the shared entities remain fully available to other works.
- **Author purity is enforceable.** The work-taxonomy relations that had previously been attached to the author (genres and movements) were removed, leaving only intrinsic person data: places of birth and death, occupations, and languages. The person and the work are now cleanly separated.
- **Curation surfaced a real defect.** The validation process exposed that the create-or-reuse behavior the architecture depends on was defective — an existing entity could not actually be reused. This was corrected. The architecture now does what it claims.

The pair is complete, consistent, and independently verifiable at the data level.

---

## Known limitations (intentionally deferred)

- **Legacy completeness signaling.** The legacy "incomplete" metadata signal counts only legacy genre fields, not knowledge relations. Sapphire readiness and the legacy completeness score remain separate signals. Reconciling them is deferred; they do not contradict each other for the purposes of the curated layer.
- **Editor convenience.** Create-on-the-fly and bulk curation tooling were deliberately not built this phase and are scheduled after the model is further exercised.
- **Reader-facing surfaces.** No rendering of the entity model was built. The architecture is validated at the data level only; Explorer and Reading Mode will consume it.
- **Additional entity types.** Types beyond those required by the first pair — atmosphere, character, series, and others — and their relation semantics are deferred until the Reading Model phase establishes what the reader experience actually needs.

---

## Consequences

- **For editors:** curation is now a two-step act — ensure the entity exists (or create it), then attach it to the work. The shared entity library is the growing vocabulary of the catalog.
- **For the reader experience:** every future surface (Explorer, Reading Mode) will be built on typed relations from works to entities, with authors joining through intrinsic facts and their works.
- **For the data model:** knowledge lives in independent, typed, lifecycle-managed objects with explicit typed relations. The catalog is a graph, not a set of widened tables.
- **For future phases:** the Reading Model phase will define how this model surfaces to the reader, and only then will the entity type set be expanded.
