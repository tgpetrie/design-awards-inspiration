#!/usr/bin/env python3
"""
Build a local 2025 award-reference catalog from the official Awwwards
Site of the Day archive.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Iterable
from urllib.request import Request, urlopen

ARCHIVE_URL = "https://www.awwwards.com/websites/sites_of_the_day/"
USER_AGENT = "Mozilla/5.0 (Codex skill builder)"

CATEGORY_TAGS = {
    "Architecture",
    "Art & Illustration",
    "Business & Corporate",
    "Culture & Education",
    "Design Agencies",
    "E-Commerce",
    "Events",
    "Experimental",
    "Fashion",
    "Film & TV",
    "Food & Drink",
    "Games & Entertainment",
    "Hotel / Restaurant",
    "Institutions",
    "Luxury",
    "Magazine / Newspaper / Blog",
    "Mobile & Apps",
    "Music & Sound",
    "Other",
    "Photography",
    "Promotional",
    "Real Estate",
    "Social responsibility",
    "Sports",
    "Startups",
    "Technology",
    "Web & Interactive",
}

TECH_TAGS = {
    "11ty",
    "AWS",
    "Angular",
    "Anime.js",
    "Astro",
    "BARBA.js",
    "Bootstrap",
    "CSS",
    "Canvas API",
    "Contentful",
    "Craft CMS",
    "Curtains.js",
    "D3",
    "DatoCMS",
    "Directus",
    "Docker",
    "Drupal",
    "Express",
    "Figma",
    "Firebase",
    "Framer",
    "GLSL",
    "GSAP",
    "Gatsby",
    "GraphQL",
    "HTML5",
    "Javascript",
    "Laravel",
    "Lottie",
    "Motion",
    "Next.js",
    "Node.js",
    "Nuxt.js",
    "P5.js",
    "PHP",
    "PixiJS",
    "Prismic",
    "Python",
    "React",
    "SVG",
    "Sanity",
    "Sass",
    "Shopify",
    "Svelte",
    "Tailwind",
    "Three.js",
    "Typescript",
    "Vanilla JS",
    "Vercel",
    "Vite",
    "Vue.js",
    "WebGL",
    "WebSockets",
    "Webflow",
    "Webpack",
    "WooCommerce",
    "Wordpress",
    "jQuery",
}


def fetch_text(url: str) -> str:
    req = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(req, timeout=30) as response:
        return response.read().decode("utf-8", "ignore")


def extract_full_award_date(block: str) -> datetime | None:
    candidates = re.findall(
        r'<br><span style="display: block; margin-top: 10px;">([^<]+)</span>',
        block,
    )
    for candidate in candidates:
        try:
            return datetime.strptime(candidate, "%b %d, %Y")
        except ValueError:
            continue
    return None


def split_tags(tags: Iterable[str]) -> tuple[list[str], list[str], list[str]]:
    categories: list[str] = []
    styles: list[str] = []
    tech: list[str] = []

    for tag in tags:
        if tag in CATEGORY_TAGS:
            categories.append(tag)
        elif tag in TECH_TAGS:
            tech.append(tag)
        else:
            styles.append(tag)

    return categories, styles, tech


def parse_block(block: str, target_year: int) -> dict | None:
    model_match = re.search(r'data-collectable-model-value="([^"]+)"', block)
    live_match = re.search(
        r'class="figure-rollover__bt"\s+href="(https?://[^"]+)"',
        block,
        re.S,
    )
    source_match = re.search(
        r'class="figure-rollover__link" href="(/sites/[^"]+)"',
        block,
    )

    award_date = extract_full_award_date(block)
    if not (model_match and award_date and live_match and source_match):
        return None

    model = json.loads(html.unescape(model_match.group(1)))
    if award_date.year != target_year:
        return None

    tags = list(model.get("tags", []))
    categories, style_tags, tech_tags = split_tags(tags)

    return {
        "title": model["title"],
        "slug": model["slug"],
        "award_source": "Awwwards",
        "award_name": "Site of the Day",
        "award_year": target_year,
        "award_date": award_date.date().isoformat(),
        "categories": categories,
        "style_tags": style_tags,
        "tech_tags": tech_tags,
        "tags": tags,
        "live_url": live_match.group(1),
        "source_url": f"https://www.awwwards.com{source_match.group(1)}",
    }


def collect_entries(target_year: int, limit: int, max_pages: int) -> list[dict]:
    entries: list[dict] = []
    seen: set[str] = set()

    for page in range(1, max_pages + 1):
        url = ARCHIVE_URL if page == 1 else f"{ARCHIVE_URL}?page={page}"
        text = fetch_text(url)
        blocks = re.findall(r'(<li class="col-3 js-collectable".*?</li>)', text, re.S)

        page_target_year_entries = 0
        page_older_than_target = False

        for block in blocks:
            parsed = parse_block(block, target_year)
            if parsed is not None:
                page_target_year_entries += 1
                if parsed["slug"] not in seen:
                    seen.add(parsed["slug"])
                    entries.append(parsed)
                    if len(entries) >= limit:
                        return entries
                continue

            block_date = extract_full_award_date(block)
            if block_date:
                block_year = block_date.year
                if block_year < target_year:
                    page_older_than_target = True

        if page_target_year_entries == 0 and page_older_than_target and entries:
            break

    return entries


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, default=2025)
    parser.add_argument("--limit", type=int, default=50)
    parser.add_argument("--max-pages", type=int, default=20)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    if args.output is None:
        args.output = (
            Path(__file__).resolve().parent.parent
            / "references"
            / f"awwwards-sotd-{args.year}.json"
        )

    entries = collect_entries(args.year, args.limit, args.max_pages)
    if len(entries) < args.limit:
        print(
            f"warning: collected {len(entries)} entries, below requested limit {args.limit}",
            file=sys.stderr,
        )

    for index, entry in enumerate(entries, start=1):
        entry["rank"] = index

    payload = {
        "dataset": f"Awwwards Site of the Day {args.year} Top {len(entries)}",
        "generated_on": datetime.now().date().isoformat(),
        "target_year": args.year,
        "source_archive": ARCHIVE_URL,
        "methodology": (
            "Collected entries from the official Awwwards Site of the Day archive "
            "in reverse chronological order until the requested number of entries "
            "for the target year was reached. Categories, style tags, and tech tags "
            "are normalized from Awwwards tag metadata."
        ),
        "entries": entries,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n")
    print(f"wrote {len(entries)} entries to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
