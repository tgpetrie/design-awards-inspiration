# Current Status

- Canonical repo: `/Users/cdmxx/Documents/design-awards-inspiration`, branch `master`, local commits intentionally not pushed yet.
- The hidden skill wrapper at `~/.codex/skills/design-awards-inspiration` is read-only metadata; all product and dataset work happens in this repo.
- Datasets: `references/awwwards-sotd-2025.json` — 200 entries, `references/awwwards-sotd-2024.json` — 167 entries, `references/awwwards-sotd-2023.json` — 200 entries. The runtime combines them into a 567-entry Awwwards catalog.
- Thumbnail coverage: 2025 = 200/200, 2024 = 167/167, 2023 = 200/200.
- `scripts/dataset_catalog.py` is the shared Awwwards metadata layer for discovery, validation, normalization, and merged runtime loading.
- `scripts/validate_dataset.py` validates dataset shape and slug uniqueness; `scripts/build_dataset_catalog.py` writes `references/catalog.json` with per-year entry counts, thumbnail coverage, and validation status.
- Dataset-writing scripts now run post-write maintenance automatically: validate changed datasets, rebuild `references/catalog.json`, and regenerate `web/catalog-data.js`.
- UI and CLI remain functional: `scripts/find_design_refs.py`, `scripts/design_refs_ui.py`, and the static `web/` app still search the merged corpus.

# Last Completed

- Fixed the UI regression introduced by the broad unification pass: feed/home now uses the original modern cinematic composition again instead of the later floating slab treatment.
- Kept the newer improvements that were still valid: inline advanced search, no-results state cards, active-filter pills, and the archive-system detail layout.
- Regression root cause was selector spillover in `web/styles.css` where feed selectors were grouped into the archive-shell override block near the end of the file.
- Selectively removed feed/discover overrides from the archive layer and re-verified feed, results, detail, surprise, and empty states locally.

# In Progress

- Nothing actively in flight. The branch is stable after the selective feed/home restoration pass.

# Next Priorities

1. **Reduce Advanced Search bulk** — replace the large category/style/tech chip walls with more compact selection controls.
2. **Handle remote thumbnail failures** — decide whether to add a thumbnail proxy/cache layer so third-party image failures stop polluting the browser experience.
3. **Targeted smoke coverage** — formalize lightweight tests for the data-maintenance path and the critical web search/detail views.
4. **Push timing** — review the unpushed local history and decide when to publish `master` to `origin/master`.

# Open Questions

- Should Advanced Search move to searchable multi-select controls next, or is the current inline chip panel acceptable for now?
- Is a local thumbnail proxy worth the complexity, or should the app continue degrading gracefully when remote images block?
- When should the unpushed local commits go to `origin/master`?

# Session Anchor

- Entered the regression-fix pass from `00b587a`.
- Use `git log --oneline -1` for the current tip before starting the next session.
