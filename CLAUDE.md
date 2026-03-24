# Claude Memory

- Project: `design-awards-inspiration` lives at `/Users/cdmxx/Documents/design-awards-inspiration` and includes the Awwwards dataset, browser UI, and helper scripts.
- Active branch: `master`. Start every session with `git status` and use `git log --oneline -1` for the current tip.
- Datasets: `references/awwwards-sotd-2025.json` has 200 entries, `references/awwwards-sotd-2024.json` has 167 entries, and `references/awwwards-sotd-2023.json` has 200 entries. All three years are thumbnail-enriched, and the runtime combines them into a 567-entry catalog.
- Data pipeline source of truth: `scripts/dataset_catalog.py` now owns Awwwards dataset discovery, validation, normalization, and summary metadata.
- Pipeline tools: `scripts/validate_dataset.py` validates all local Awwwards year files, and `scripts/build_dataset_catalog.py` writes `references/catalog.json` as the machine-readable corpus summary.
- Post-write maintenance: `scripts/build_awwwards_top50.py` and `scripts/fetch_thumbnails.py` now validate written datasets, rebuild `references/catalog.json`, and regenerate `web/catalog-data.js` automatically after successful writes.
- Runtime note: CLI, local UI, and the static web bundle still load all matching `references/awwwards-sotd-*.json` files through the shared loader.
- Focus areas: keep the dataset validated, keep `references/catalog.json` current, and avoid breaking the preview UI.
- Session anchor entering this automation pass: `bd364f9`. Confirm the current tip from git instead of relying on this note alone.
- Reminder: update `NEXT_STEPS.md` and `HANDOFF_TEMPLATE.md` before handing back to Codex.
