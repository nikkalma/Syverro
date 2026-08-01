# Sapphire Roadmap

> Living roadmap for the Sapphire curated layer. Updated at phase boundaries.
> Last checkpoint: 2026-08-01.

---

## Milestones

| Status | Milestone |
|--------|-----------|
| ✅ **Completed** | **Sapphire Phase 1 — Independent Knowledge Entity Architecture** |
| ⏭️ **Next** | **Sapphire Phase 2 — Reading Model** |
| ⛔ Deferred | Explorer, Reading Mode surfaces, additional entity types |

---

## Checkpoint Log

### 2026-08-01 — Phase 1 closed

**Completed milestone:** Sapphire Phase 1 — Independent Knowledge Entity Architecture

The knowledge-entity architecture was proven end-to-end by curating the first complete Sapphire pair (Jane Eyre + Charlotte Brontë) against the local development database. Architecture frozen and documented in the Sapphire ADR. No implementation work performed in this checkpoint.

**Next milestone:** Sapphire Phase 2 — Reading Model

**Key decisions recorded:**
- Knowledge entities are independent first-class objects with their own lifecycle.
- Books are the semantic center of the curated layer.
- Authors carry only intrinsic person data.
- Work-level taxonomy belongs to Works, not Authors.
- Vocabulary emerges through editorial curation, not predefined taxonomies.
- Phase 1 intentionally avoided UI automation; validation came before tooling.

---

## Sapphire Phase 1 — Independent Knowledge Entity Architecture ✅

**Status:** Completed (2026-08-01)

**Goal:** Prove that a complete, high-quality Sapphire pair can be expressed within a frozen knowledge-entity architecture.

**Validated outcomes:**
- A full pair (work + author) expressed through typed relations to independent entities.
- Entity reuse without mutation; entity creation without pollution.
- Entity independence — no implicit or reverse references.
- Author purity — only intrinsic person data on the author.
- Curation surfaced and corrected a defect in the create-or-reuse behavior.

**Deliverable:** Architecture Decision Record (ADR) — Sapphire Knowledge Entity Architecture.

---

## Sapphire Phase 2 — Reading Model ⏭️

**Status:** Next

**Goal:** Define how the entity model surfaces to the reader — the reading experience as a traversal of knowledge, not a record lookup.

**Scope is intentionally not yet specified.** Phase 2 begins with the same validation-first discipline as Phase 1: establish what the reader experience requires of the model before expanding it.

**Prerequisites:** Phase 1 architecture frozen (done).

---

## Deferred — beyond Phase 2

- **Explorer** — reader-facing exploration of the knowledge graph.
- **Reading Mode** — the reading experience surface.
- **Additional entity types** (atmosphere, character, series, and others) — deferred until the Reading Model phase establishes what the reader actually needs.
