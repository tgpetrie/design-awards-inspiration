# Current Status

- Canonical repo: `/Users/cdmxx/Documents/design-awards-inspiration`, branch `master`, clean working tree.
- The hidden skill wrapper at `~/.codex/skills/design-awards-inspiration` is read-only metadata — all product work happens here.
- Datasets: `references/awwwards-sotd-2025.json` — 200 entries, `references/awwwards-sotd-2024.json` — 167 entries, and `references/awwwards-sotd-2023.json` — 200 entries. The runtime combines all local Awwwards year files into a 567-entry catalog.
- Thumbnail coverage: 2025 = 200/200, 2024 = 167/167, 2023 = 200/200.
- Static web UI (`web/`) is fully functional: swipeable feed, natural-language search, advanced search modal, detail view.
- CLI tools in `scripts/` are functional: `find_design_refs.py`, `design_refs_ui.py`, `build_awwwards_top50.py`, `build_fwa_fotd.py`, `fetch_thumbnails.py`.
- Vercel deployment config exists; local commits are intentionally not pushed yet.

# Last Completed

- Adapted `scripts/fetch_thumbnails.py` so it can target one or more dataset files explicitly.
- Enriched `references/awwwards-sotd-2024.json` and `references/awwwards-sotd-2023.json` using the same `og:image` / Microlink strategy already used for 2025.
- Verified all three datasets remain valid after enrichment and now have complete thumbnail coverage.
- Verified the UI discover/feed surface renders enriched cards correctly against the 2023+2025 merged catalog.

# In Progress

- Nothing actively in flight. Repo is clean and stable.

# Next Priorities

1. **Expand Awwwards next** — add 2022 before introducing another source so the corpus stays structurally consistent.
2. **Keep year-based naming stable** — continue using `references/awwwards-sotd-YYYY.json` and let the runtime auto-discover the files.
3. **Push to origin** — the repo is intentionally still ahead of `origin/master`; wait until rename cleanup and verification are complete before pushing.
4. **Product work** — UI improvements, new features, or use the catalog for a real design task now that the three-year discovery surface is visually consistent.

# Open Questions

- Should 2022 be the next Awwwards year added after 2023?
- Should 2022 be enriched immediately when added, or should enrichment wait until after the raw scrape is reviewed?
- Should build outputs (new JSON files, thumbnail caches) be gitignored explicitly?
- Push the unpushed commit to `origin/master`?

# Last Verified Commit

- `85b4cf5`
