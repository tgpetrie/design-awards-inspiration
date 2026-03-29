# design-awards-inspiration

`design-awards-inspiration` is a local design-reference system with two parts:

1. An assistant-facing skill documented in `SKILL.md`, used by Codex / Claude style agents to find, compare, and translate award-winning web references into reusable design direction.
2. A local web app and CLI tooling for browsing, searching, validating, and maintaining a multi-year Awwwards `Site of the Day` dataset.

The repo is the canonical source of truth. The hidden wrapper skill path, if you use one, should stay thin and point here.

## What This Repo Does

- Builds and maintains a normalized Awwwards reference corpus.
- Lets you query the corpus from the command line.
- Serves a browser UI for exploration, archive search, detail views, and interaction experiments.
- Packages the corpus into a static bundle so the web app can run without a live Python backend.
- Gives AI assistants a concrete skill contract for inspiration work instead of vague design-browsing prompts.

## Core Concepts

### The skill

The skill entrypoint is `SKILL.md`.

That file defines:

- when to use the skill
- how to search the local catalog first
- how to return curated inspiration packs instead of dumping links
- how to translate references into layout, typography, color, motion, and interaction guidance
- how to rebuild the dataset when the catalog needs to expand

This is not a copy-a-website tool. The intended output is pattern extraction and adaptation, not cloning brand identity or source code.

### The web app

The web app lives in `web/` and is served by `scripts/design_refs_ui.py`.

It provides:

- a cinematic feed / discovery view
- archive search across the merged dataset
- detail pages with related references
- advanced search controls
- static fallback via `web/catalog-data.js`
- experimental interaction routes such as `#/motion-lab`

### The dataset pipeline

The dataset is stored in year-based JSON files:

- `references/awwwards-sotd-2025.json`
- `references/awwwards-sotd-2024.json`
- `references/awwwards-sotd-2023.json`

The shared dataset metadata layer is `scripts/dataset_catalog.py`.

It owns:

- dataset discovery
- validation
- normalization
- merged runtime loading
- catalog summaries

## Current Dataset State

At the time of writing, the local corpus contains:

- 2025: 200 entries
- 2024: 167 entries
- 2023: 200 entries
- combined corpus: 567 entries

The machine-readable summary is written to `references/catalog.json`.

## Requirements

This repo is intentionally lightweight.

- Python 3.10+ recommended
- no Node.js dependency is required for the core app or data pipeline
- modern browser for the local UI
- optional: `ANTHROPIC_API_KEY` for image-to-query analysis features exposed by `scripts/design_refs_ui.py`
- optional: Vercel account if you want to deploy the static `web/` app

Most scripts use only the Python standard library.

## Quick Start

### 1. Clone and enter the repo

```bash
git clone https://github.com/tgpetrie/design-awards-inspiration.git
cd design-awards-inspiration
```

### 2. Launch the local browser app

```bash
python3 scripts/design_refs_ui.py
```

This starts the local server and opens the browser automatically.

If you do not want it to auto-open:

```bash
python3 scripts/design_refs_ui.py --no-open
```

If you want a specific port:

```bash
python3 scripts/design_refs_ui.py --port 5827 --no-open
```

### 3. Use the app

Once running, the web UI lets you:

- browse the cinematic home / feed
- search the full archive
- filter by categories, styles, tech tags, and year
- inspect detail pages and related references
- experiment with motion treatments in the Motion Lab route

## CLI Usage

The main query tool is `scripts/find_design_refs.py`.

Examples:

```bash
python3 scripts/find_design_refs.py editorial luxury motion
python3 scripts/find_design_refs.py --category "Design Agencies" --style Typography
python3 scripts/find_design_refs.py --style Animation --tech WebGL --limit 6
python3 scripts/find_design_refs.py --similar-to "Obys' Design Books"
python3 scripts/find_design_refs.py --year 2024 --category "Architecture" --json
```

Useful listing commands:

```bash
python3 scripts/find_design_refs.py --list-categories
python3 scripts/find_design_refs.py --list-styles
python3 scripts/find_design_refs.py --list-tech
```

## How To Use The Skill With Codex Or Claude

### Assistant entrypoint

The assistant-facing contract is `SKILL.md`.

A good session start is:

1. Open the repo.
2. Read `SKILL.md`.
3. Read `CLAUDE.md`, `NEXT_STEPS.md`, `HANDOFF_TEMPLATE.md`, and `WORKFLOW.md` if you are continuing ongoing work.
4. Use the local catalog first before browsing the wider web.

### What the skill is good at

Use it when you want an assistant to:

- find references by category, style, interaction pattern, or tech
- find sites similar to a named reference
- translate inspiration into concrete design direction
- inspect a reference interaction and reimplement an original variant
- curate a short inspiration pack for a new page, landing page, or design system

### Example prompts for the assistant

- `Find award-winning references for a premium SaaS landing page with strong typography.`
- `Show me bold editorial-style websites I can borrow layout ideas from.`
- `Find references similar to REJOUICE but more restrained.`
- `Borrow the motion pattern from this site, but rebuild it originally in our own app.`

### Claude-specific local preview support

This repo already contains Claude preview wiring:

- `.claude/launch.json`
- `.claude/settings.local.json`

The launch config runs:

```bash
python3 scripts/design_refs_ui.py --no-open --port 5827
```

That means Claude-based local preview tools can boot the app on port `5827` using the checked-in launch configuration.

## How The Web App Works

### Runtime model

The app can run in two modes:

1. Backed by the Python server from `scripts/design_refs_ui.py`
2. Static-only using the bundled `web/catalog-data.js`

The static bundle is generated so the browser app still has dataset access even without the live Python API.

### Key frontend files

- `web/index.html` - app shell and route containers
- `web/app.js` - routing, search, views, feed, detail state, and motion lab loading
- `web/styles.css` - the main visual system and layout
- `web/effects/pointer-carousel.js` - isolated motion logic for the Motion Lab carousel experiment
- `web/catalog-data.js` - generated static dataset bundle

### Important routes / views

- home / feed
- archive search / results
- detail view
- surprise / discovery flows
- `#/motion-lab` for isolated interaction work

## Dataset Maintenance

### Validate all datasets

```bash
python3 scripts/validate_dataset.py
```

Validate specific files:

```bash
python3 scripts/validate_dataset.py references/awwwards-sotd-2025.json
```

Validation checks include:

- required top-level keys
- required entry fields
- array shape correctness
- URL field types
- slug uniqueness within a dataset
- ISO date format
- rank integrity

### Rebuild the machine-readable catalog

```bash
python3 scripts/build_dataset_catalog.py
```

This writes:

- `references/catalog.json`

### Rebuild the static web bundle

```bash
python3 scripts/build_web_catalog_bundle.py
```

This writes:

- `web/catalog-data.js`

### Scrape more Awwwards entries

```bash
python3 scripts/build_awwwards_top50.py
python3 scripts/build_awwwards_top50.py --year 2025 --limit 200 --output references/awwwards-sotd-2025.json
python3 scripts/build_awwwards_top50.py --year 2024 --limit 200 --output references/awwwards-sotd-2024.json
python3 scripts/build_awwwards_top50.py --year 2023 --limit 200 --output references/awwwards-sotd-2023.json
```

Despite the historical filename, `build_awwwards_top50.py` now supports arbitrary limits and writes correctly named year files.

### Fetch / refresh thumbnails

```bash
python3 scripts/fetch_thumbnails.py
```

Target specific datasets:

```bash
python3 scripts/fetch_thumbnails.py --dataset references/awwwards-sotd-2024.json
python3 scripts/fetch_thumbnails.py --dataset references/awwwards-sotd-2023.json --force
```

Thumbnail strategy currently tries:

1. `og:image` from the live site
2. `og:image` from the source page
3. Microlink screenshot fallback

### Post-write maintenance is automatic

After a successful write, these scripts automatically run:

- `scripts/build_awwwards_top50.py`
- `scripts/fetch_thumbnails.py`

Their post-write flow is:

1. validate the written dataset(s)
2. rebuild `references/catalog.json`
3. regenerate `web/catalog-data.js`

That logic lives in `scripts/post_write_maintenance.py`.

## Deployment

### Vercel

The checked-in `vercel.json` points Vercel at the static `web/` directory:

- output directory: `web`
- rewrite rule: serve files directly from the static bundle

That means the deployable artifact is the generated static web app, not the live Python server.

If you change the dataset and want the deployed app to reflect it, rebuild the static bundle first:

```bash
python3 scripts/build_web_catalog_bundle.py
```

## Collaboration Workflow

The repo already includes handoff and memory docs:

- `CLAUDE.md`
- `NEXT_STEPS.md`
- `HANDOFF_TEMPLATE.md`
- `WORKFLOW.md`

Recommended ritual:

1. Run `git status`
2. Run `git log --oneline -1`
3. Read the coordination docs if you are continuing prior work
4. Make the change
5. Verify the result
6. Update the handoff docs if the work changes project state meaningfully

## Repo Layout

```text
design-awards-inspiration/
  .claude/                     Claude preview config
  references/                  Year-based datasets and derived catalog
  scripts/                     CLI, scraper, validator, server, maintenance tools
  web/                         Static app, styles, JS, generated bundle
  SKILL.md                     Assistant-facing skill contract
  CLAUDE.md                    Project memory
  NEXT_STEPS.md                Current repo state and priorities
  HANDOFF_TEMPLATE.md          Reusable session handoff format
  WORKFLOW.md                  Shared collaboration ritual
  vercel.json                  Static deploy config
```

## Troubleshooting

### The app loads but the dataset looks stale

Rebuild the static bundle:

```bash
python3 scripts/build_web_catalog_bundle.py
```

### Dataset writes succeeded but the web app is inconsistent

Run the maintenance tools manually:

```bash
python3 scripts/validate_dataset.py
python3 scripts/build_dataset_catalog.py
python3 scripts/build_web_catalog_bundle.py
```

### Remote thumbnails fail in the browser

This is expected for some third-party hosts. Common causes:

- CORS restrictions
- blocked hotlinking
- dead `og:image` URLs
- temporary network failures

The app degrades gracefully, but a future proxy/cache layer may improve this.

### Image analysis search fails

Set:

```bash
export ANTHROPIC_API_KEY=your_key_here
```

This is only needed for image-to-query analysis paths in `scripts/design_refs_ui.py`.

## Design Intent

This repo is for design borrowing, not design copying.

Use it to extract:

- layout systems
- hierarchy
- typography direction
- motion rhythm
- navigation patterns
- image treatment
- interaction ideas

Do not use it to copy:

- brand assets
- logos
- exact copy
- signature scenes
- distinctive compositions one-to-one
