# Handoff — [Session Date]

Fill this out before ending any work session. Both Claude and Codex read this to orient at the start of the next session.

---

## What changed
- [List key diffs, file edits, or decisions made this session. One bullet per meaningful change.]

## Currently in progress
- [Any task that is mid-flight: half-written code, an open question waiting on a decision, a script not yet tested. Write "Nothing — repo is clean at [hash]" if everything is committed.]

## What should happen next
- [Concrete next steps in priority order, specific enough that the next session can start without asking clarifying questions.]

## What files matter
- [Name the files or directories touched this session, plus any that deserve attention next session.]

## Anchor commit or hash
- [The exact full commit hash this handoff is built on. Copy from `git log --oneline -1`.]

---

## Last completed handoff (example — update each session)

**Session: 2026-03-24 — Awwwards 2023 expansion**

### What changed
- Added `references/awwwards-sotd-2023.json` from the Awwwards scraper and verified the raw file shape matches 2024.
- Confirmed the 2023 scraper produced 200 entries after increasing archive depth; the old default page depth returned 0, so the scraper defaults were updated for older years.
- Verified combined search and UI API loading against the merged 2023+2024+2025 catalog with an exact total of 567 entries.
- Updated the handoff docs so the repo state now reflects 2023, 2024, and 2025 together.

### Currently in progress
- Nothing. The 2023 expansion and runtime verification are complete.

### What should happen next
1. Expand Awwwards to 2022 before introducing FWA or another source.
2. Keep the year-based file naming convention and runtime auto-discovery path unchanged.
3. Push to `origin/master` only after this three-year catalog commit is reviewed.
4. Start product work once dataset direction is confirmed.

### What files matter
- `NEXT_STEPS.md`, `HANDOFF_TEMPLATE.md`, `CLAUDE.md` — all updated this session.
- `references/awwwards-sotd-2025.json`, `references/awwwards-sotd-2024.json`, and `references/awwwards-sotd-2023.json` — current Awwwards year datasets, combined at runtime into 567 entries.
- `scripts/build_awwwards_top50.py` — updated so older years scan deeper archive pages by default.
- `scripts/dataset_catalog.py`, `scripts/find_design_refs.py`, `scripts/design_refs_ui.py` — still power year-based discovery and merged loading.
- `web/` — full static UI, no changes needed right now.

### Anchor commit
- `aff8c4b`
