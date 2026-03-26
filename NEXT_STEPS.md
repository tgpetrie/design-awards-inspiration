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

- Unified the web UI around a single archive shell: dark atmospheric background, pale-lilac surface panels, shared pill/button language, and consistent spacing across feed, results, detail, and related states.
- Replaced the Advanced Search popup with an inline expanding panel under the main search area.
- Reworked no-results/suggestion handling so failed queries render a real empty state with active-filter pills and recovery actions.
- Added year-filter support back through the full stack: options API, search API, CLI search, and the inline web UI.
- Verified the local app across feed, results, inline advanced search, no-results state, detail, and surprise navigation.

# In Progress

- Nothing actively in flight. The current branch is stable after the UI unification pass.

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

- Entered this UI unification pass from `26ed2e7`.
- Use `git log --oneline -1` for the current tip before starting the next session.
