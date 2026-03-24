# Current Status

- Canonical repo: `/Users/cdmxx/Documents/design-awards-inspiration`, branch `master`, clean working tree.
- The hidden skill wrapper at `~/.codex/skills/design-awards-inspiration` is read-only metadata — all product work happens here.
- Dataset: `references/awwwards-sotd-2025.json` — 200 Awwwards SOTD 2025 entries.
- Static web UI (`web/`) is fully functional: swipeable feed, natural-language search, advanced search modal, detail view.
- CLI tools in `scripts/` are functional: `find_design_refs.py`, `design_refs_ui.py`, `build_awwwards_top50.py`, `build_fwa_fotd.py`, `fetch_thumbnails.py`.
- Vercel deployment config exists; local commits are intentionally not pushed yet.

# Last Completed

- Migrated the full project from the hidden skill folder to this visible repo.
- Created `WORKFLOW.md`, `NEXT_STEPS.md`, and `HANDOFF_TEMPLATE.md` as shared coordination docs.
- Cleaned `.gitignore` and confirmed repo structure.
- Renamed the canonical dataset file to `references/awwwards-sotd-2025.json` and updated all in-repo code and docs references.
- Verified dataset loading, CLI search, and the local UI API against the renamed file.

# In Progress

- Nothing actively in flight. Repo is clean and stable.

# Next Priorities

1. **Expand Awwwards next** — add more Awwwards years before introducing another source so the corpus stays structurally consistent.
2. **Choose the next Awwwards years** — define the year range and output naming so expansion stays predictable.
3. **Push to origin** — the repo is intentionally still ahead of `origin/master`; wait until rename cleanup and verification are complete before pushing.
4. **Product work** — UI improvements, new features, or use the catalog for a real design task once the dataset naming baseline is settled.

# Open Questions

- Which Awwwards years should be added next after 2025?
- Should build outputs (new JSON files, thumbnail caches) be gitignored explicitly?
- Push the unpushed commit to `origin/master`?

# Last Verified Commit

- `4ca8548`
