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

- Added an explicit validation layer for all local Awwwards year datasets.
- Added machine-readable catalog generation at `references/catalog.json` and terminal coverage reporting by year.
- Verified all three datasets pass validation with the current schema and have complete thumbnail coverage.
- Wired `scripts/build_awwwards_top50.py` and `scripts/fetch_thumbnails.py` to run post-write maintenance automatically after successful dataset writes.
- Verified the merged runtime still works through the CLI search flow, the local UI API, and the static catalog bundle generator.

# In Progress

- Nothing actively in flight. Repo is stable after the pipeline-hardening pass.

# Next Priorities

1. **Expand Awwwards deliberately** — add 2022 only after the automated update workflow is confirmed stable.
2. **Targeted smoke coverage** — decide whether to add lightweight script tests for validation/catalog/static-bundle regeneration.
3. **Push timing** — review the unpushed local history and decide when to publish `master` to `origin/master`.
4. **Product work** — once the data workflow is settled, return to UI polish or new discovery features.

# Open Questions

- Is 2022 still the next Awwwards year to add, or should another pipeline step happen first?
- Should the script-level smoke checks be formalized so maintenance regressions are caught before commit?
- When should the unpushed local commits go to `origin/master`?

# Session Anchor

- Entered this post-write automation pass from `bd364f9`.
- Use `git log --oneline -1` for the current tip before starting the next session.
