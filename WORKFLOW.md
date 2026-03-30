# Shared Workflow Ritual

1. Save all changed files in your editor, then `cd /Users/cdmxx/Documents/design-awards-inspiration`.
2. Run `git status` and `git log --oneline -1` to confirm the working tree and current tip.
3. Dataset-writing scripts (`build_awwwards_top50.py`, `fetch_thumbnails.py`) run validation, catalog rebuild, and static bundle regeneration automatically after successful writes.
4. `fetch_thumbnails.py` now audits the current thumbnail first; it keeps pass-grade assets, fetches alternates only for warn/fail cases, and stores `thumbnail_source` plus `thumbnail_quality` metadata on the dataset entry.
5. Re-run `python3 scripts/validate_dataset.py`, `python3 scripts/build_dataset_catalog.py`, or `python3 scripts/build_web_catalog_bundle.py` manually only when debugging or verifying derived artifacts directly.
6. If you need to refresh thumbnail quality for an older year, run `python3 scripts/fetch_thumbnails.py --dataset references/awwwards-sotd-<year>.json` and then inspect `references/catalog.json` for pass/warn/fail counts.
7. Commit meaningful changes with clear messages and document any manual verification that the other tool should know.
8. Keep `NEXT_STEPS.md` and `HANDOFF_TEMPLATE.md` up to date before ending your session.
9. Signal the next collaborator to re-read the disk (close/reopen files) after repo moves or new files land.
