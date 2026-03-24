---
name: design-awards-inspiration
description: Curated award-winning web design reference lookup for inspiration work. Use when Codex needs to find strong website references by category, visual style, interaction pattern, or technology; retrieve similar award-winning examples to a named site; compare references from sources like Awwwards or CSS Design Awards; or turn inspiration references into concrete layout, typography, color, and motion direction for a new page, landing page, or design system.
---

# Design Awards Inspiration

## Overview

Use the local catalog first. This skill bundles a searchable multi-year Awwwards `Site of the Day` catalog with normalized categories, style tags, tech tags, award dates, and live/source URLs.

The skill also ships with a local browser UI. Run `python3 scripts/design_refs_ui.py` or `design_refs_ui` to open the catalog as a filterable web app.

The goal is not to copy a site literally. Use the references to extract transferable patterns: composition, hierarchy, typography, pacing, navigation, motion, media treatment, and tone.

## Workflow

1. Search the local catalog before browsing:

```bash
python3 scripts/find_design_refs.py --category "Design Agencies" --style Typography
python3 scripts/find_design_refs.py --style Animation --tech WebGL --limit 6
python3 scripts/find_design_refs.py --similar-to "Obys' Design Books"
python3 scripts/find_design_refs.py editorial luxury motion
python3 scripts/design_refs_ui.py
```

2. Return a compact inspiration pack instead of a raw dump:
   - Pick 3 to 7 references.
   - Explain why each one matches the request.
   - Call out what to borrow:
     layout system, type scale, contrast strategy, image treatment, motion rhythm, navigation model, interaction ideas.
   - Call out what not to copy literally:
     brand assets, copy, logos, mascots, exact compositions, or distinctive signature scenes.

3. Translate references into reusable direction:
   - Convert them into concrete design guidance.
   - Name the emerging pattern clearly, for example:
     `editorial luxury`, `bold product storytelling`, `minimal portfolio with brutalist accents`, `motion-led studio site`.
   - When useful, propose a page structure or component list derived from the references.

4. Expand beyond the local catalog only when needed:
   - If the user wants more than the bundled local Awwwards catalog.
   - If the user wants fresher material.
   - If the local dataset does not cover the requested niche.
   - When expanding, start with [references/source-index.md](references/source-index.md).

## Award-Winning References

Use this section as the mental map for where references should come from.

- `Awwwards seed set`
  The bundled local catalog currently combines `references/awwwards-sotd-2025.json` (200 entries), `references/awwwards-sotd-2024.json` (167 entries), and `references/awwwards-sotd-2023.json` (200 entries). Use this first because it is fast, searchable, validated, and already normalized for category, style, and tech. `references/catalog.json` is the machine-readable summary of the available year files.
- `CSSDA expansion`
  Use CSS Design Awards when the user wants more award-winning references beyond the local set, especially when you want short written descriptions, studio names, and category labels.
- `SiteInspire browse source`
  Use SiteInspire when the user wants broader digital inspiration by layout, style, or site type, even when it is not strictly award-focused.
- `Borrow patterns, not identity`
  Extract structure, hierarchy, pacing, navigation, typography, color systems, component ideas, and motion patterns. Do not replicate exact branding, imagery, copy, or signature visual scenes.

## Catalog Shape

The bundled datasets live in year-based files such as [references/awwwards-sotd-2025.json](references/awwwards-sotd-2025.json), [references/awwwards-sotd-2024.json](references/awwwards-sotd-2024.json), and [references/awwwards-sotd-2023.json](references/awwwards-sotd-2023.json). The CLI and local UI combine all matching `references/awwwards-sotd-*.json` files at runtime, and [references/catalog.json](references/catalog.json) summarizes the available datasets.

Each entry contains:

- `title`
- `award_date`
- `categories`
- `style_tags`
- `tech_tags`
- `live_url`
- `source_url`

Use [references/style-taxonomy.md](references/style-taxonomy.md) when the user is vague about whether they mean industry/category, visual style, or frontend technique.

## Example Prompts

Use prompts like these when working with the skill:

```text
Find award-winning references for a premium SaaS landing page with strong typography.
Show me bold editorial-style websites I can borrow layout ideas from.
Give me mobile-app-inspired product pages with clean UI and light motion.
Find references similar to Obys' Design Books but more minimal.
Show me playful e-commerce or checkout inspiration that still feels premium.
Find dashboard-like product sites with strong hierarchy and restrained color.
```

## Rebuilding The Dataset

Rebuild the seed set with the bundled scraper:

```bash
python3 scripts/build_awwwards_top50.py
python3 scripts/build_awwwards_top50.py --year 2025 --limit 200 --output references/awwwards-sotd-2025.json
python3 scripts/build_awwwards_top50.py --year 2024 --limit 200 --output references/awwwards-sotd-2024.json
```

The scraper uses the official Awwwards archive and stops once it has collected the requested number of entries for the target year. After dataset changes, run `python3 scripts/validate_dataset.py`, `python3 scripts/build_dataset_catalog.py`, and `python3 scripts/build_web_catalog_bundle.py` so the catalog and static bundle stay aligned.

## Output Standard

When using this skill for a real design task, prefer this response shape:

1. One-sentence style summary.
2. `References:` 3 to 7 items with direct links and short rationale.
3. `Patterns to borrow:` layout, type, motion, imagery, interaction.
4. `Build direction:` a concrete recommendation for the user's page or system.

Keep the response curated. The value of this skill is selection and translation, not dumping links.

For each reference, prefer this compact format:

```text
- Site Name
  Live: https://...
  Source: https://...
  Why it fits: one sentence
  Borrow from it: 2 to 4 concrete ideas
```

When the user wants to browse the references personally, always include the direct `Live` link. Include the `Source` link when available so they can inspect the award/context page too.

When the user already knows the general style but wants to steer the direction, ask them to describe each reference in plain language like:

- `I like the typography from this one`
- `I want the pacing and scrolling from this one`
- `Use the layout system from this one but not the color palette`
- `Borrow the navigation pattern here but keep our brand cleaner`

Then synthesize those notes into one design direction instead of treating each site independently.
