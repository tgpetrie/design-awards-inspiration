# Current Status

- Canonical repo: `/Users/cdmxx/Documents/design-awards-inspiration`, branch `master`, clean working tree.
- The hidden skill wrapper at `~/.codex/skills/design-awards-inspiration` is read-only metadata — all product work happens here.
- Dataset: `references/awwwards-sotd-2025-top-50.json` — 200 Awwwards SOTD 2025 entries (the `-top-50` in the filename is a misnomer; it holds 200, not 50).
- Static web UI (`web/`) is fully functional: swipeable feed, natural-language search, advanced search modal, detail view.
- CLI tools in `scripts/` are functional: `find_design_refs.py`, `design_refs_ui.py`, `build_awwwards_top50.py`, `build_fwa_fotd.py`, `fetch_thumbnails.py`.
- Vercel deployment config exists; one commit ahead of `origin/master`, not yet pushed.

# Last Completed

- Migrated the full project from the hidden skill folder to this visible repo.
- Created `WORKFLOW.md`, `NEXT_STEPS.md`, and `HANDOFF_TEMPLATE.md` as shared coordination docs.
- Cleaned `.gitignore` and confirmed repo structure.
- Ran a sync cleanup pass: rewrote all coordination docs to reflect real repo state.
- Committed as `a9f0fb849c764e687d6f30499fba11014136f0f8`.

# In Progress

- Nothing actively in flight. Repo is clean and stable.

# Next Priorities

1. **Decide on next dataset focus** — FWA FotD (`build_fwa_fotd.py` exists but has never been run), or expand Awwwards to additional years.
2. **Rename the dataset file** — `awwwards-sotd-2025-top-50.json` is misleading; it contains 200 entries. Rename to `awwwards-sotd-2025.json` or add a clarifying note in `references/source-index.md`.
3. **Push to origin** — one commit ahead of `origin/master`; decide whether to push or stay local.
4. **Product work** — UI improvements, new features, or use the catalog for a real design task.

# Open Questions

- Which dataset source gets expanded next: FWA FotD, CSS Design Awards, or more Awwwards years?
- Should build outputs (new JSON files, thumbnail caches) be gitignored explicitly?
- Push the unpushed commit to `origin/master`?

# Last Verified Commit

- `a9f0fb849c764e687d6f30499fba11014136f0f8`
