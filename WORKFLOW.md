# Shared Workflow Ritual

1. Save all changed files in your editor, then `cd /Users/cdmxx/Documents/design-awards-inspiration`.
2. Run `git status` and `git log --oneline -1` to confirm the working tree and current tip.
3. After dataset changes, run `python3 scripts/validate_dataset.py` and `python3 scripts/build_dataset_catalog.py` before handing off.
4. If runtime catalog metadata changed, regenerate `web/catalog-data.js` with `python3 scripts/build_web_catalog_bundle.py`.
5. Commit meaningful changes with clear messages and document any manual verification that the other tool should know.
6. Keep `NEXT_STEPS.md` and `HANDOFF_TEMPLATE.md` up to date before ending your session.
7. Signal the next collaborator to re-read the disk (close/reopen files) after repo moves or new files land.
