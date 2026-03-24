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

**Session: 2026-03-24 — Dataset rename cleanup**

### What changed
- Renamed the canonical dataset file from `references/awwwards-sotd-2025-top-50.json` to `references/awwwards-sotd-2025.json`.
- Updated all in-repo code references in the build script, CLI search script, thumbnail fetcher, local UI server, and skill docs.
- Verified the renamed dataset loads as 200 entries and that the UI API still serves search results.
- Updated `CLAUDE.md` and `NEXT_STEPS.md` so the handoff state matches the new filename.

### Currently in progress
- Nothing. Rename cleanup and verification are complete.

### What should happen next
1. Expand Awwwards to additional years before introducing FWA or another source.
2. Decide which Awwwards years to add next and keep the output naming aligned with the year-based convention.
3. Push to `origin/master` only after this rename cleanup commit is reviewed.
4. Start product work once dataset direction is confirmed.

### What files matter
- `NEXT_STEPS.md`, `HANDOFF_TEMPLATE.md`, `CLAUDE.md` — all updated this session.
- `references/awwwards-sotd-2025.json` — 200-entry canonical dataset.
- `scripts/build_awwwards_top50.py`, `scripts/find_design_refs.py`, `scripts/fetch_thumbnails.py`, `scripts/design_refs_ui.py` — all updated to the new dataset filename.
- `web/` — full static UI, no changes needed right now.

### Anchor commit
- `4ca8548`
