# Current Status

- Canonical repo: `/Users/cdmxx/Documents/design-awards-inspiration`, branch `master`, clean working tree.
- The hidden skill wrapper at `~/.codex/skills/design-awards-inspiration` is read-only metadata — all product work happens here.
- Datasets: `references/awwwards-sotd-2025.json` — 200 entries, and `references/awwwards-sotd-2024.json` — 167 entries. The runtime combines all local Awwwards year files into a 367-entry catalog.
- Runtime note: the shared loader normalizes `thumbnail_url` for older datasets, but the 2024 file has not been thumbnail-enriched yet.
- Static web UI (`web/`) is fully functional: swipeable feed, natural-language search, advanced search modal, detail view.
- CLI tools in `scripts/` are functional: `find_design_refs.py`, `design_refs_ui.py`, `build_awwwards_top50.py`, `build_fwa_fotd.py`, `fetch_thumbnails.py`.
- Vercel deployment config exists; local commits are intentionally not pushed yet.

# Last Completed

- Added `references/awwwards-sotd-2024.json` by scraping the Awwwards 2024 archive.
- Verified the 2024 output shape matches the existing dataset format and honestly captured 167 entries, below the requested 200.
- Updated the CLI and local UI runtime to discover and combine all `references/awwwards-sotd-*.json` files automatically.
- Verified combined dataset loading, CLI search, and the local UI API against the merged 2024+2025 catalog.

# In Progress

- Nothing actively in flight. Repo is clean and stable.

# Next Priorities

1. **Expand Awwwards next** — add 2023 before introducing another source so the corpus stays structurally consistent.
2. **Keep year-based naming stable** — continue using `references/awwwards-sotd-YYYY.json` and let the runtime auto-discover the files.
3. **Push to origin** — the repo is intentionally still ahead of `origin/master`; wait until rename cleanup and verification are complete before pushing.
4. **Product work** — UI improvements, new features, or use the catalog for a real design task once the dataset naming baseline is settled.

# Open Questions

- Should 2023 be the next Awwwards year added after 2024?
- Should the 2024 dataset get a thumbnail-enrichment pass so it appears more fully in discover/feed views?
- Should build outputs (new JSON files, thumbnail caches) be gitignored explicitly?
- Push the unpushed commit to `origin/master`?

# Last Verified Commit

- `209367b`
