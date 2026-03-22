#!/usr/bin/env python3
"""
Fetch thumbnails for each reference and store them in the dataset.

Strategy (in order):
  1. og:image from the live site  — free, designed by the studio, usually beautiful
  2. Microlink screenshot          — free tier, captures actual page screenshot

Run once to populate all entries:

    python3 scripts/fetch_thumbnails.py

Re-run any time to fill in missing entries (already-populated entries are skipped).
Use --force to re-fetch everything.
"""

from __future__ import annotations

import argparse
import json
import re
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATASET_PATH = ROOT / "references" / "awwwards-sotd-2025-top-50.json"
REQUEST_DELAY = 0.5

_BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml",
}

_OG_PATTERNS = [
    re.compile(
        r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\'](https?://[^"\'>\s]+)',
        re.IGNORECASE,
    ),
    re.compile(
        r'<meta[^>]+content=["\'](https?://[^"\'>\s]+)[^>]+property=["\']og:image["\']',
        re.IGNORECASE,
    ),
]


def fetch_og_image(url: str) -> str:
    """Return the og:image URL found at *url*, or an empty string."""
    try:
        req = urllib.request.Request(url, headers=_BROWSER_HEADERS)
        with urllib.request.urlopen(req, timeout=12) as resp:
            html = resp.read(65536).decode("utf-8", errors="ignore")
    except Exception:
        return ""
    for pattern in _OG_PATTERNS:
        match = pattern.search(html)
        if match:
            return match.group(1)
    return ""


def fetch_microlink_screenshot(url: str) -> str:
    """Return a Microlink screenshot URL for *url* using the free API."""
    api_url = f"https://api.microlink.io/?url={urllib.request.quote(url, safe='')}&screenshot=true&meta=false"
    try:
        req = urllib.request.Request(
            api_url,
            headers={"Accept": "application/json", "User-Agent": "design-refs-app/1.0"},
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        screenshot = payload.get("data", {}).get("screenshot", {})
        return screenshot.get("url", "")
    except Exception:
        return ""


def get_thumbnail(live_url: str, source_url: str) -> tuple[str, str]:
    """Return (thumbnail_url, source_label) using the best available method."""
    url = fetch_og_image(live_url)
    if url:
        return url, "og"
    url = fetch_og_image(source_url)
    if url:
        return url, "og:source"
    url = fetch_microlink_screenshot(live_url)
    if url:
        return url, "screenshot"
    return "", "none"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-fetch even entries that already have a thumbnail_url.",
    )
    args = parser.parse_args()

    data = json.loads(DATASET_PATH.read_text(encoding="utf-8"))
    entries = data["entries"]
    total = len(entries)
    fetched = failed = skipped = 0

    for i, entry in enumerate(entries):
        if entry.get("thumbnail_url") and not args.force:
            skipped += 1
            print(f"  skip [{i + 1}/{total}] {entry['title']}")
            continue

        print(f"  [{i + 1}/{total}] {entry['title']}...", end=" ", flush=True)
        url, source = get_thumbnail(entry["live_url"], entry["source_url"])
        entry["thumbnail_url"] = url

        if url:
            fetched += 1
            print(f"✓ ({source})")
        else:
            failed += 1
            print("—")

        if i < total - 1:
            time.sleep(REQUEST_DELAY)

    DATASET_PATH.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(f"\nDone. Fetched: {fetched}  Failed: {failed}  Skipped: {skipped}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
