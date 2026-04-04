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
- The app now has a shared footer and a tighter mobile feed layout via `web/app.js`, `web/index.html`, and `web/styles.css`.
- Strategy has shifted from pure corpus expansion to a curated enrichment layer: external public case studies should be treated as design-evidence sources, not as a generic crawl target.

# Last Completed

- Added a shared project footer across feed, results, detail, and motion-lab views.
- Tightened the feed/home mobile layout so the dataset pill, search dock, CTAs, and footer adapt better to narrow screens.
- Shortened the feed search placeholder on small screens to prevent clipping.
- Kept the existing thumbnail quality gate and curated Awwwards corpus intact while improving the app shell.

# In Progress

- No active implementation is in flight.
- The next phase is planning and structuring a curated case-study enrichment layer before any new automation is added.

# Next Priorities

1. **Create a starter source registry** — shortlist roughly 20–30 strong agency/studio case-study sources with notes on design quality and reasoning richness.
2. **Define the raw + interpreted schema** — separate collected source records from interpreted design records so future boards/features have a stable data shape.
3. **Create an annotation template** — capture project context, typography, layout, motion, interaction, tone, borrowable features, why-it-works notes, and plain-language summaries for the first 20 case studies.
4. **Build the first small curated batch** — only after the registry/schema/template exist; do not jump into broad crawling.
5. **Keep Awwwards as the backbone** — treat agency case studies as an enrichment layer, not a replacement for the existing corpus.

# Open Questions

- What is the best on-disk shape for the new evidence layer: JSON files in `references/`, a small database, or both?
- How should screenshot capture be represented for case studies: single hero image, multiple sectional captures, or deferred until after the first annotation pass?
- What scoring scale should interpreted records use for `quality_score` and `borrowability_score` so the ratings stay comparable across sources?

# Session Anchor

- Entered the case-study planning phase from `9b3f5f2`.
- Use `git log --oneline -1` for the current tip before starting the next session.
