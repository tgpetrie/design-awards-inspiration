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

**Session: 2026-03-24 — Sync cleanup pass**

### What changed
- Rewrote `NEXT_STEPS.md` to reflect real repo state: 200-entry dataset, full UI in place, nothing in progress.
- Filled `HANDOFF_TEMPLATE.md` with a real reusable structure and a completed example.
- Updated `CLAUDE.md` to note the 200-entry dataset, pin the verified commit, and remove stale "recent work" phrasing.
- Confirmed `WORKFLOW.md` is accurate; no edits needed.

### Currently in progress
- Nothing. Repo is clean.

### What should happen next
1. Decide which dataset to expand next: FWA FotD (`scripts/build_fwa_fotd.py` exists but has never been run) or more Awwwards years.
2. Consider renaming `references/awwwards-sotd-2025-top-50.json` → `awwwards-sotd-2025.json` to drop the misleading `-top-50` suffix (it holds 200 entries).
3. Push to `origin/master` when ready — currently 1 commit ahead.
4. Start product work once dataset direction is confirmed.

### What files matter
- `NEXT_STEPS.md`, `HANDOFF_TEMPLATE.md`, `CLAUDE.md` — all updated this session.
- `references/awwwards-sotd-2025-top-50.json` — 200-entry dataset, filename is a misnomer.
- `scripts/build_fwa_fotd.py` — FWA scraper, exists but never been run.
- `web/` — full static UI, no changes needed right now.

### Anchor commit
- `a9f0fb849c764e687d6f30499fba11014136f0f8`
