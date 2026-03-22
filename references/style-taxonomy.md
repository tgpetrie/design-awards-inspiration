# Style Taxonomy

Use three search dimensions instead of treating every tag as the same thing.

## 1. Category

Use `category` when the user means industry, business model, or site type.

Examples:

- `Design Agencies`
- `Business & Corporate`
- `Culture & Education`
- `Promotional`
- `Technology`
- `Web & Interactive`
- `E-Commerce`
- `Fashion`
- `Luxury`
- `Startups`

## 2. Style

Use `style` when the user means visual language or interaction feel.

Common examples in the bundled dataset:

- `Animation`
- `Typography`
- `Colorful`
- `Clean`
- `Graphic design`
- `Unusual Navigation`
- `Storytelling`
- `Minimal`
- `Illustration`
- `Fullscreen`

## 3. Tech

Use `tech` when the user cares about implementation cues or motion stack.

Common examples:

- `GSAP`
- `WebGL`
- `Webflow`
- `React`
- `Next.js`
- `Framer`
- `Shopify`
- `Wordpress`

## Query Examples

```bash
python3 scripts/find_design_refs.py --category "Design Agencies" --style Typography
python3 scripts/find_design_refs.py --category Technology --style Animation --tech WebGL
python3 scripts/find_design_refs.py --similar-to "Osmo"
python3 scripts/find_design_refs.py --list-categories
python3 scripts/find_design_refs.py --list-styles
python3 scripts/find_design_refs.py --list-tech
```
