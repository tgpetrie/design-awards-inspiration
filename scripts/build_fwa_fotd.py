#!/usr/bin/env python3
"""
Build a local FWA (Favourite Website Awards) FOTD catalog.

FWA of the Day (FOTD) has run since 1998 — one of the oldest prestige web awards.
Each entry is juried by FWA's panel. Data sourced from the public FWA API.

Attribution: FWA (thefwa.com) — used for reference and inspiration discovery.
Each entry links back to its FWA case page (source_url).
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import date, datetime
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
REFERENCES_DIR = ROOT / "references"

API_BASE = "https://thefwa.com/api/cases"
CASE_BASE = "https://thefwa.com/case"
THUMB_BASE = "https://thefwa.com"
USER_AGENT = "Mozilla/5.0 (design-awards-inspiration catalog builder)"
PAGE_SIZE = 50

# FWA category names — kept as-is for faithful attribution
FWA_CATEGORIES = {
    "Advertising/Marketing",
    "App",
    "Campaign",
    "Education",
    "Entertainment",
    "Fashion/Beauty",
    "Film/Animation",
    "Game",
    "Music",
    "Non-profit/Charity",
    "Personal/Portfolio",
    "Product/Service",
    "Retail/E-commerce",
    "Sport",
    "Technology",
    "Travel/Lifestyle",
}


def fetch_json(url: str) -> dict:
    req = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urlopen(req, timeout=20) as r:
        return json.loads(r.read())


def best_thumbnail(case: dict) -> str:
    """Return the best available thumbnail URL for a case."""
    th = case.get("thumbnail") or {}
    # Prefer 1364px wide, fall back to smaller sizes
    for size_key in ("1364", "958", "538"):
        size = th.get(size_key) or {}
        # Pick the largest span variant
        for span_key in ("span12", "span10", "span9", "span6", "span5", "span4", "span3"):
            path = size.get(span_key)
            if path:
                return THUMB_BASE + path
    return ""


def awarded_date(case: dict) -> date | None:
    awards = case.get("awards") or []
    for a in awards:
        if a.get("type") == "FOTD":
            raw = a.get("awardedDate") or a.get("awardFor")
            if raw:
                try:
                    return datetime.strptime(raw[:10], "%Y-%m-%d").date()
                except ValueError:
                    pass
    return None


def normalise_tags(categories: list[dict]) -> tuple[list[str], list[str]]:
    """Split FWA categories into our taxonomy."""
    cats, styles = [], []
    for c in categories:
        name = c.get("name", "").strip()
        if name in FWA_CATEGORIES:
            cats.append(name)
        elif name:
            styles.append(name)
    return cats, styles


def build_entry(case: dict, target_year: int) -> dict | None:
    d = awarded_date(case)
    if not d or d.year != target_year:
        return None

    live_url = (case.get("url") or "").strip()
    slug = case.get("slug") or ""
    title = (case.get("title") or "").strip()
    if not (title and slug and live_url):
        return None

    categories, style_tags = normalise_tags(case.get("categories") or [])

    # bestViewedOn gives platform hints: "desktop", "mobile", "vr", etc.
    platform = (case.get("bestViewedOn") or "").strip()
    if platform and platform.lower() not in ("", "n/a"):
        style_tags.append(platform.title())

    all_tags = categories + style_tags

    return {
        "title": title,
        "slug": slug,
        "award_source": "FWA",
        "award_name": "FWA of the Day",
        "award_year": target_year,
        "award_date": d.isoformat(),
        "categories": categories,
        "style_tags": style_tags,
        "tech_tags": [],            # FWA doesn't expose tech stack tags
        "tags": all_tags,
        "live_url": live_url,
        "source_url": f"{CASE_BASE}/{slug}",
        "rank": None,
        "thumbnail_url": best_thumbnail(case),
        "motion_tags": [],
        "layout_tags": [],
        "short_description": (case.get("description") or "").strip()[:280],
    }


def collect(target_year: int, limit: int, verbose: bool) -> list[dict]:
    entries: list[dict] = []
    offset = 0
    past_year = False

    while len(entries) < limit:
        url = f"{API_BASE}?type=fotd&limit={PAGE_SIZE}&offset={offset}"
        if verbose:
            print(f"  Fetching offset={offset} …", file=sys.stderr)

        data = fetch_json(url)
        cases = data.get("cases") or []
        if not cases:
            break

        for case in cases:
            d = awarded_date(case)
            if d is None:
                continue
            if d.year > target_year:
                continue  # still in a newer year, skip
            if d.year < target_year:
                past_year = True
                break
            entry = build_entry(case, target_year)
            if entry:
                entries.append(entry)
                if verbose:
                    print(f"  [{len(entries)}] {entry['award_date']} {entry['title']}", file=sys.stderr)
                if len(entries) >= limit:
                    break

        if past_year or len(cases) < PAGE_SIZE:
            break

        offset += PAGE_SIZE
        time.sleep(0.3)  # polite pacing

    return entries


def main() -> int:
    parser = argparse.ArgumentParser(description="Build FWA FOTD reference catalog")
    parser.add_argument("--year",  type=int, default=2025, help="Award year to collect")
    parser.add_argument("--limit", type=int, default=200, help="Max entries to collect")
    parser.add_argument("--out",   type=Path, default=None, help="Output JSON path")
    parser.add_argument("--verbose", "-v", action="store_true")
    args = parser.parse_args()

    out_path = args.out or (REFERENCES_DIR / f"fwa-fotd-{args.year}.json")
    REFERENCES_DIR.mkdir(exist_ok=True)

    print(f"Collecting up to {args.limit} FWA FOTD entries for {args.year}…", file=sys.stderr)
    entries = collect(args.year, args.limit, args.verbose)
    print(f"Collected {len(entries)} entries.", file=sys.stderr)

    payload = {
        "dataset": f"FWA of the Day {args.year}",
        "generated_on": date.today().isoformat(),
        "target_year": args.year,
        "source_archive": "https://thefwa.com/cases/type/fotd",
        "attribution": "FWA (thefwa.com) — Favourite Website Awards. Each entry links to its original FWA case page.",
        "methodology": (
            "Collected FWA of the Day (FOTD) entries in reverse chronological order via the "
            "public FWA API. Categories are sourced directly from FWA metadata."
        ),
        "entries": entries,
    }

    out_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
    print(f"Written to {out_path}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
