# Claude Memory

- Project: `design-awards-inspiration` lives at `/Users/cdmxx/Documents/design-awards-inspiration` and includes the Awwwards dataset, browser UI, and helper scripts.
- Active branch: `master`. Start every session with `git status` and use `git log --oneline -1` for the current tip.
- Datasets: `references/awwwards-sotd-2025.json` has 200 entries, `references/awwwards-sotd-2024.json` has 167 entries, and `references/awwwards-sotd-2023.json` has 200 entries. The runtime combines them into a 567-entry catalog.
- Thumbnail gate: `scripts/thumbnail_quality.py` scores images with explicit heuristics (dimensions, cover scale, entropy, edge variance, white-space ratio, suspicious path tokens).
- Current audit state: 2025 has been rerun and now reports 184 pass / 11 warn / 5 fail with 195 thumbnail URLs retained. 2024 and 2023 still need the same rerun.
- Data pipeline source of truth: `scripts/dataset_catalog.py` owns Awwwards dataset discovery, validation, normalization, quality summaries, and merged runtime loading.
- Pipeline tools: `scripts/validate_dataset.py` validates all local Awwwards year files, and `scripts/build_dataset_catalog.py` writes `references/catalog.json` with per-year entry counts, thumbnail coverage, and thumbnail quality counts.
- Post-write maintenance: `scripts/build_awwwards_top50.py` and `scripts/fetch_thumbnails.py` validate written datasets, rebuild `references/catalog.json`, and regenerate `web/catalog-data.js` automatically after successful writes.
- Runtime note: CLI, local UI, and the static web bundle still load all matching `references/awwwards-sotd-*.json` files through the shared loader.
- UI note: feed and motion-lab now prefer pre-vetted thumbnail metadata and avoid fail-grade thumbnails; detail/results still render warn-grade thumbnails for now.
- Regression guardrail: do not include feed selectors (`.feed-*`, `.discover-action-btn`, `.feed-dataset-pill`) in the archive-shell override block at the end of `web/styles.css`; that caused the floating-slab feed regression.
- Search note: year filtering is wired through `scripts/find_design_refs.py`, `scripts/design_refs_ui.py`, and the web client.
- Focus areas: finish the 2024/2023 thumbnail-quality rerun, keep `references/catalog.json` current, and avoid regressing the feed/detail UI.
- Session anchor entering the thumbnail-quality pass: `0caa38d`. Confirm the current tip from git instead of relying on this note alone.
- Reminder: update `NEXT_STEPS.md` and `HANDOFF_TEMPLATE.md` before handing back.
