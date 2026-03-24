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

**Session: 2026-03-24 — Awwwards 2024 expansion**

### What changed
- Added `references/awwwards-sotd-2024.json` from the Awwwards scraper and verified the output shape matches the existing dataset format.
- Confirmed the 2024 scraper produced 167 entries rather than the requested 200, and noted that the file still lacks thumbnail enrichment.
- Updated the CLI and local UI runtime to auto-discover and combine all `references/awwwards-sotd-*.json` files.
- Verified combined search and UI API loading against the merged 2024+2025 catalog.

### Currently in progress
- Nothing. The 2024 expansion and runtime merge are complete.

### What should happen next
1. Expand Awwwards to 2023 before introducing FWA or another source.
2. Keep the year-based file naming convention and runtime auto-discovery path unchanged.
3. Push to `origin/master` only after this multi-year catalog commit is reviewed.
4. Start product work once dataset direction is confirmed.

### What files matter
- `NEXT_STEPS.md`, `HANDOFF_TEMPLATE.md`, `CLAUDE.md` — all updated this session.
- `references/awwwards-sotd-2025.json` and `references/awwwards-sotd-2024.json` — current Awwwards year datasets, combined at runtime into 367 entries.
- `scripts/dataset_catalog.py`, `scripts/build_awwwards_top50.py`, `scripts/find_design_refs.py`, `scripts/design_refs_ui.py` — updated for year-based discovery and merged loading.
- `web/` — full static UI, no changes needed right now.

### Anchor commit
- `209367b`
