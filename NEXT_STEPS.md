# Current Status

- Canonical repo: `/Users/cdmxx/Documents/design-awards-inspiration`, branch `master`, clean working tree.
- The hidden skill wrapper at `~/.codex/skills/design-awards-inspiration` is read-only metadata — all product work happens here.
- Datasets: `references/awwwards-sotd-2025.json` — 200 entries, `references/awwwards-sotd-2024.json` — 167 entries, and `references/awwwards-sotd-2023.json` — 200 entries. The runtime combines all local Awwwards year files into a 567-entry catalog.
- Runtime note: the shared loader normalizes `thumbnail_url` for older datasets, but the 2023 and 2024 files have not been thumbnail-enriched yet.
- Static web UI (`web/`) is fully functional: swipeable feed, natural-language search, advanced search modal, detail view.
- CLI tools in `scripts/` are functional: `find_design_refs.py`, `design_refs_ui.py`, `build_awwwards_top50.py`, `build_fwa_fotd.py`, `fetch_thumbnails.py`.
- Vercel deployment config exists; local commits are intentionally not pushed yet.

# Last Completed

- Added `references/awwwards-sotd-2023.json` by scraping the Awwwards 2023 archive.
- Verified the 2023 output shape matches 2024 at the raw file and entry schema level; 2025 still differs only because it includes thumbnail enrichment.
- Confirmed the first 2023 attempt returned 0 entries with the old page-depth default, then fixed the scraper defaults so older years scan deeper by default.
- Verified combined dataset loading, CLI search, and the local UI API against the merged 2023+2025 catalog.

# In Progress

- Nothing actively in flight. Repo is clean and stable.

# Next Priorities

1. **Expand Awwwards next** — add 2022 before introducing another source so the corpus stays structurally consistent.
2. **Keep year-based naming stable** — continue using `references/awwwards-sotd-YYYY.json` and let the runtime auto-discover the files.
3. **Push to origin** — the repo is intentionally still ahead of `origin/master`; wait until rename cleanup and verification are complete before pushing.
4. **Product work** — UI improvements, new features, or use the catalog for a real design task once the dataset naming baseline is settled.

# Open Questions

- Should 2022 be the next Awwwards year added after 2023?
- Should the 2023 and 2024 datasets get a thumbnail-enrichment pass so they appear more fully in discover/feed views?
- Should build outputs (new JSON files, thumbnail caches) be gitignored explicitly?
- Push the unpushed commit to `origin/master`?

# Last Verified Commit

- `07ba814`
