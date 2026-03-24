# Claude Memory

- Project: design-awards-inspiration lives at `/Users/cdmxx/Documents/design-awards-inspiration` and includes the award-winning seed set, UI scripts, and helper tools.
- Active branch: `master`. Keep Claude and Codex synced on the latest commit before editing.
- Datasets: `references/awwwards-sotd-2025.json` holds 200 entries, `references/awwwards-sotd-2024.json` holds 167 entries, and `references/awwwards-sotd-2023.json` holds 200 entries. The CLI and UI combine them at runtime into a 567-entry Awwwards catalog.
- Focus areas: keep the dataset clean, keep `.gitignore` and workflow docs current, and avoid breaking the preview UI.
- Current cleanup: the 2023 Awwwards dataset was added, the runtime still auto-discovers all local Awwwards year files, and the scraper now uses a deeper default archive scan for older years.
- Last verified commit: `07ba814`
- Reminder: update `NEXT_STEPS.md` and `HANDOFF_TEMPLATE.md` before handing back to Codex.
