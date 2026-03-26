# Claude Memory

- Project: `design-awards-inspiration` lives at `/Users/cdmxx/Documents/design-awards-inspiration` and includes the Awwwards dataset, browser UI, and helper scripts.
- Active branch: `master`. Start every session with `git status` and use `git log --oneline -1` for the current tip.
- Datasets: `references/awwwards-sotd-2025.json` has 200 entries, `references/awwwards-sotd-2024.json` has 167 entries, and `references/awwwards-sotd-2023.json` has 200 entries. All three years are thumbnail-enriched, and the runtime combines them into a 567-entry catalog.
- Data pipeline source of truth: `scripts/dataset_catalog.py` now owns Awwwards dataset discovery, validation, normalization, and summary metadata.
- Pipeline tools: `scripts/validate_dataset.py` validates all local Awwwards year files, and `scripts/build_dataset_catalog.py` writes `references/catalog.json` as the machine-readable corpus summary.
- Post-write maintenance: `scripts/build_awwwards_top50.py` and `scripts/fetch_thumbnails.py` now validate written datasets, rebuild `references/catalog.json`, and regenerate `web/catalog-data.js` automatically after successful writes.
- Runtime note: CLI, local UI, and the static web bundle still load all matching `references/awwwards-sotd-*.json` files through the shared loader.
- UI note: the web app now uses an inline advanced-search panel, a shared archive shell across results/detail/feed, active-filter pills, and explicit empty-state handling.
- Search note: year filtering is wired through `scripts/find_design_refs.py`, `scripts/design_refs_ui.py`, and the web client.
- Focus areas: keep the dataset validated, keep `references/catalog.json` current, and avoid regressing the unified preview UI.
- Session anchor entering this UI pass: `26ed2e7`. Confirm the current tip from git instead of relying on this note alone.
- Reminder: update `NEXT_STEPS.md` and `HANDOFF_TEMPLATE.md` before handing back to Codex.
