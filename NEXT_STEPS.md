# Current Status

- Canonical repo: `/Users/cdmxx/Documents/design-awards-inspiration`, branch `master`.
- The hidden skill wrapper at `~/.codex/skills/design-awards-inspiration` remains metadata-only; all product and dataset work happens in this repo.
- Datasets: `references/awwwards-sotd-2025.json` — 200 entries, `references/awwwards-sotd-2024.json` — 167 entries, `references/awwwards-sotd-2023.json` — 200 entries. The runtime combines them into a 567-entry Awwwards catalog.
- Thumbnail quality gate is now live in the pipeline via `scripts/thumbnail_quality.py` and `scripts/fetch_thumbnails.py`.
- Current thumbnail state:
  - 2025: 195/200 thumbnails kept, quality pass/warn/fail = 184/11/5
  - 2024: 167/167 thumbnails present, quality audit not rerun yet
  - 2023: 200/200 thumbnails present, quality audit not rerun yet
- `scripts/dataset_catalog.py` is the shared Awwwards metadata layer for discovery, validation, normalization, quality summaries, and merged runtime loading.
- `references/catalog.json` and `web/catalog-data.js` were rebuilt after the 2025 quality pass.
- The web app now prefers pre-vetted thumbnail metadata and keeps fail-grade thumbnails out of the cinematic feed and motion-lab carousel.

# Last Completed

- Added `scripts/thumbnail_quality.py` to analyze thumbnail candidates with explicit image heuristics: dimensions, cover scale, entropy, edge variance, near-white ratio, and suspicious path tokens.
- Updated `scripts/fetch_thumbnails.py` so it audits the current thumbnail first, only fetches alternates when the current image warns/fails, and stores `thumbnail_source` plus `thumbnail_quality` metadata on each entry.
- Extended validation/catalog reporting so dataset summaries now include thumbnail quality pass/warn/fail counts.
- Updated `web/app.js` so feed and motion-lab use precomputed quality metadata, and fail-grade thumbnails no longer render in the main visual views.
- Refreshed the 2025 dataset with the new gate and rebuilt the catalog/static bundle.

# In Progress

- The quality audit has only been rerun for 2025 so far. 2024 and 2023 still carry legacy thumbnail URLs without `thumbnail_quality` metadata.

# Next Priorities

1. **Rerun thumbnail auditing for 2024 and 2023** — bring the older datasets onto the same quality-metadata standard as 2025.
2. **Review the 2025 warning set** — decide whether the 11 warn-grade thumbnails need manual overrides or stricter automatic replacement.
3. **Reduce Advanced Search bulk** — replace the large category/style/tech chip walls with more compact controls.
4. **Targeted smoke coverage** — formalize lightweight checks for search/detail/feed after data-maintenance runs.

# Open Questions

- Should warn-grade thumbnails remain visible on archive/detail cards, or should the UI hide them until a pass-grade replacement exists?
- Is a local thumbnail proxy/cache worth adding, or is the current direct-remote approach acceptable once low-quality assets are screened out?
- After 2024/2023 are rerun, should the gate become stricter about low-entropy share cards?

# Session Anchor

- Entered this thumbnail-quality pass from `0caa38d`.
- Use `git log --oneline -1` for the current tip before starting the next session.
