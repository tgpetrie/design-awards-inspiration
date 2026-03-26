# Handoff — 2026-03-26

---

## What changed

- **Selective regression fix landed**: restored feed/home to the prior modern cinematic look by removing feed/discover selector overrides from the archive unification block in `web/styles.css`.
- **Kept valid UI upgrades**: inline advanced search, archive-style results/detail surfaces, active-filter pills, and no-results state cards remain in place.
- **Regression cause was identified explicitly**: selector spillover in the end-of-file archive override block (`.feed-*`, `.discover-action-btn`, `.feed-dataset-pill`) forced feed controls into the pale slab treatment.
- **Cross-view sanity check completed**: feed, results, detail, surprise navigation, and no-results state were re-tested locally after the rollback.

## Currently in progress

- Nothing active. The current session is complete after restoring feed/home and preserving the newer results/detail improvements.

## What should happen next

1. **Tighten Advanced Search density**: keep the inline panel, but replace the large chip walls with compact/selectable controls.
2. **Handle remote thumbnail errors**: decide whether to add a proxy/cache layer so CORS/404 thumbnail noise stops flooding the browser console.
3. **Clean push strategy**: review local unpushed history and decide when to publish `master`.

## What files matter

- `web/index.html` — feed shell markup and results shell framing (one pre-existing local edit remains outside this fix).
- `web/app.js` — route/view behavior for feed/results/detail/empty states and inline advanced panel behavior.
- `web/styles.css` — archive-shell layer plus the selective rollback that excludes feed/discover selectors from end-of-file overrides.
- `scripts/find_design_refs.py` — CLI year-filter support.
- `scripts/design_refs_ui.py` — API/options year-filter support.

## Anchor commit

- `00b587a` — Commit that introduced the over-broad feed regression; this handoff reflects the selective rollback work on top of it. Use `git log --oneline -1` for the current tip.
