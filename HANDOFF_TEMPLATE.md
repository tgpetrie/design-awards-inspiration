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

**Session: 2026-03-24 — Post-write automation for dataset maintenance**

### What changed
- Added shared post-write maintenance so dataset-writing scripts validate changed files, rebuild `references/catalog.json`, and regenerate `web/catalog-data.js` automatically.
- Updated `scripts/build_awwwards_top50.py` and `scripts/fetch_thumbnails.py` to call the shared maintenance flow after successful writes.
- Kept `scripts/build_dataset_catalog.py` and `scripts/build_web_catalog_bundle.py` aligned with the same shared maintenance helpers.
- Verified the pipeline still validates cleanly and the merged runtime still works.

### Currently in progress
- Nothing. Post-write automation is wired and verified.

### What should happen next
1. Decide whether to add lightweight smoke checks for the automated maintenance path.
2. Decide whether Awwwards 2022 is the next expansion step now that dataset writes auto-maintain the derived artifacts.
3. Push to `origin/master` only after the local history is reviewed.
4. Resume product work once the data workflow decision is made.

### What files matter
- `scripts/post_write_maintenance.py` — shared validation/catalog/static-bundle automation for dataset writers.
- `scripts/build_awwwards_top50.py` and `scripts/fetch_thumbnails.py` — now trigger post-write maintenance automatically.
- `scripts/build_dataset_catalog.py` and `scripts/build_web_catalog_bundle.py` — aligned to the shared maintenance helpers.
- `references/catalog.json` and `web/catalog-data.js` — derived artifacts kept in sync automatically after dataset writes.
- `CLAUDE.md`, `NEXT_STEPS.md`, `WORKFLOW.md` — coordination docs aligned to the automated maintenance flow.

### Anchor commit
- Incoming anchor was `bd364f9`; confirm the current tip with `git log --oneline -1`.
