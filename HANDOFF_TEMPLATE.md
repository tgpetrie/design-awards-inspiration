# Handoff — 2026-03-26

---

## What changed

- **Search vocabulary massively expanded** (~250 terms in `QUERY_ALIASES`): colors (purple, gold, neon), moods (moody, ethereal, rebellious), slang (bling, fire, dope, janky, swanky), materials (chrome, matte, glossy), design movements (bauhaus, memphis, y2k, swiss, glassmorphism), and visual adjectives (sharp, crisp, airy, dense, punchy…).
- **Spell correction + "did you mean"**: `editDistance()` + `spellSuggest()` — when a query returns no matches, checks tokens against known alias keys and shows a clickable suggestion inline (e.g. "blinngy" → did you mean "blingy"?).
- **Default result limit raised**: 8 → 24 (max 48). Searches now return a full page of results by default.
- **Year filter removed** from results page — user found it irrelevant for inspiration browsing.
- **Quick-search chips removed** — they were visually identical to Optional Focus and confused users. Vocabulary expansion makes them redundant; just type.
- **Results page layout tightened**: search bar → action buttons → Optional Focus → results. No duplicate filter rows.
- **Vercel deployed**: commit `61103fb` is live in production.

## Currently in progress

- Nothing — repo is clean at `61103fb`.

## What should happen next

1. **More vocabulary**: the alias approach is manual and will always have gaps. Consider whether a smarter fallback (e.g. fuzzy substring match on entry titles/descriptions) would reduce whack-a-mole. Alternatively, add a richer `description` field to each dataset entry to give the text search more surface area.
2. **Detail view dark mode**: the detail view (`#detail-view`) still has a light background — inconsistent with the dark results shell.
3. **Action buttons on result cards**: "Open Live Site" + "Open Source Page" are chunky — could be icon buttons or smaller to let the image breathe.
4. **Advanced Search modal dark adaptation**: opens with light-ish background against the dark shell.
5. **"Browse all" heading**: the static text "Open the live site or the Awwwards page directly from each card." is stale copy — consider removing or updating.
6. **Push to origin/master** if not already done after the Vercel deploy.

## What files matter

- `web/app.js` — all search logic, `QUERY_ALIASES`, `editDistance`, `spellSuggest`, `handleSearchError`, chip state, rendering.
- `web/styles.css` — dark shell, card grid, `.suggest-btn` styles.
- `web/index.html` — structure; year filter and prompt chips were removed here.
- `web/catalog-data.js` — preloaded static catalog (567 entries, 3 years).

## Anchor commit

- `61103fb` — Search UX overhaul: vocabulary, spell correction, cleaner results page.
