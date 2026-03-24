# Handoff — [Session Date]

Fill this out before ending any work session. Both Claude and Codex read this to orient at the start of the next session.

---

## What changed
- [List key diffs, file edits, or decisions made this session. One bullet per meaningful change.]

## Currently in progress
- [Any task that is mid-flight: half-written code, an open question waiting on a decision, a script not yet tested. Write "Nothing — repo is clean" if everything is committed.]

## What should happen next
- [Concrete next steps in priority order, specific enough that the next session can start without asking clarifying questions.]

## What files matter
- [Name the files or directories touched this session, plus any that deserve attention next session.]

## Anchor commit or hash
- [Use `git log --oneline -1` for the current tip. If this file is being updated before the commit exists, note the incoming anchor and tell the next tool to confirm the new tip from git.]

---

## Last completed handoff (example — update each session)

**Session: 2026-03-24 — Pipeline hardening for Awwwards datasets**

### What changed
- Expanded `scripts/dataset_catalog.py` into the shared Awwwards schema and metadata layer used by runtime loading.
- Added `scripts/validate_dataset.py` to validate required top-level keys, entry shape, array fields, URL/string fields, and slug uniqueness.
- Added `scripts/build_dataset_catalog.py` to generate `references/catalog.json` with per-year entry counts, thumbnail coverage, and validation status.
- Rebuilt `web/catalog-data.js` from the validated merged catalog and verified CLI search plus the local UI API still work.

### Currently in progress
- Nothing. Validation, catalog generation, and runtime verification are complete.

### What should happen next
1. Decide whether scraper and thumbnail-enrichment scripts should regenerate `references/catalog.json` and `web/catalog-data.js` automatically.
2. Decide whether Awwwards 2022 is the next expansion step now that validation and coverage reporting exist.
3. Push to `origin/master` only after the local history is reviewed.
4. Resume product work once the data workflow decision is made.

### What files matter
- `scripts/dataset_catalog.py` — source of truth for Awwwards discovery, validation, normalization, and merged loading.
- `scripts/validate_dataset.py` and `scripts/build_dataset_catalog.py` — new validation and reporting entrypoints.
- `references/catalog.json` — machine-readable summary of available Awwwards datasets.
- `references/awwwards-sotd-2025.json`, `references/awwwards-sotd-2024.json`, `references/awwwards-sotd-2023.json` — validated year datasets.
- `web/catalog-data.js` — regenerated static catalog bundle.
- `CLAUDE.md`, `NEXT_STEPS.md`, `WORKFLOW.md` — coordination docs aligned to the hardened pipeline.

### Anchor commit
- Incoming anchor was `85b4cf5`; confirm the current tip with `git log --oneline -1`.
