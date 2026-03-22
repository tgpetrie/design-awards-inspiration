# design-awards-inspiration

This project is evolving from a Codex/Claude skill plus CLI helper into a real product: a curated visual design discovery app with an embedded AI curator layer.

## Product direction
- The app is the product.
- The skill is the intelligence layer inside the product.
- Keep the first-screen UX calm and natural-language-first.
- Do not regress into a cluttered filter tool.
- Keep advanced controls hidden by default.
- Favor visual-first discovery, editorial structure, and rich metadata.

## Core priorities
1. Structured metadata for references
2. Reference detail pages
3. Image / thumbnail scaffolding
4. Richer result cards
5. Collections / saved boards scaffolding
6. AI-curator hooks

## UX rules
- One primary natural-language search input
- Optional broad focus controls only at first
- Advanced search behind a toggle
- Results should feel visual and curated
- Explain why results fit
- Product should feel premium, editorial, and intentional

## Future direction to preserve
The project should support visual search using screenshots and short screen clips for animation and interaction references. This includes:
- searching from screenshots
- searching from cropped screen clips or short motion snippets
- identifying animation traits like breathing glow, halo pulse, stagger reveal, parallax drift, tilt depth, cursor trails, and other motion patterns
- using visual examples to help the curator recommend related references

## Technical preferences
- Refactor incrementally
- Preserve working functionality
- Keep architecture maintainable
- Separate search logic, metadata normalization, routing, UI rendering, and future AI hooks
