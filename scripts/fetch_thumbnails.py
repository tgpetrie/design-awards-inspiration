#!/usr/bin/env python3
"""
Fetch thumbnails for each reference and store them in the dataset.

Candidate strategy (in order):
  1. og:image from the live site
  2. og:image from the Awwwards source page
  3. Microlink screenshot of the live site

Each candidate is analyzed locally. The script keeps the best passing thumbnail,
falls back to the best warning-grade thumbnail when necessary, and records the
quality verdict on each entry.

Run once to populate all entries:

    python3 scripts/fetch_thumbnails.py

Re-run any time to fill in missing or stale entries. Use --force to re-fetch
all entries.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

from post_write_maintenance import MaintenanceError, run_post_write_maintenance
from thumbnail_quality import (
    ThumbnailCandidate,
    analyze_thumbnail_url,
    evaluate_thumbnail_quality,
    select_best_thumbnail,
)

ROOT = Path(__file__).resolve().parent.parent
DATASET_PATH = ROOT / "references" / "awwwards-sotd-2025.json"
REQUEST_DELAY = 0.1

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
    api_url = f"https://api.microlink.io/?url={urllib.parse.quote(url, safe='')}&screenshot=true&meta=false"
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


def build_thumbnail_candidates(live_url: str, source_url: str) -> list[ThumbnailCandidate]:
    candidates: list[ThumbnailCandidate] = []
    seen: set[str] = set()

    for source_label, candidate_url in (
        ("og", fetch_og_image(live_url)),
        ("og:source", fetch_og_image(source_url)),
        ("screenshot", fetch_microlink_screenshot(live_url)),
    ):
        cleaned = (candidate_url or "").strip()
        if not cleaned or cleaned in seen:
            continue
        seen.add(cleaned)
        candidates.append(ThumbnailCandidate(url=cleaned, source=source_label))

    return candidates


def audit_existing_thumbnail(entry: dict) -> dict | None:
    url = (entry.get("thumbnail_url") or "").strip()
    if not url:
        return None
    source = (entry.get("thumbnail_source") or "none").strip() or "none"
    return evaluate_thumbnail_quality(analyze_thumbnail_url(url, source=source))


def enrich_dataset(dataset_path: Path, force: bool) -> tuple[int, int, int, int]:
    data = json.loads(dataset_path.read_text(encoding="utf-8"))
    entries = data["entries"]
    total = len(entries)
    fetched = failed = skipped = warned = 0

    print(f"\nDataset: {dataset_path}")
    for i, entry in enumerate(entries):
        has_thumbnail = bool(entry.get("thumbnail_url"))
        has_quality = isinstance(entry.get("thumbnail_quality"), dict)
        if has_thumbnail and has_quality and not force:
            skipped += 1
            print(f"  skip [{i + 1}/{total}] {entry['title']}")
            continue

        print(f"  [{i + 1}/{total}] {entry['title']}...", end=" ", flush=True)

        existing_quality = None if force else audit_existing_thumbnail(entry)
        if existing_quality and existing_quality["status"] == "pass":
            entry["thumbnail_source"] = existing_quality["source"]
            entry["thumbnail_quality"] = existing_quality
            fetched += 1
            print(f"✓ (kept:{existing_quality['source']})")
            if i < total - 1:
                time.sleep(REQUEST_DELAY)
            continue

        candidates = []
        current_url = (entry.get("thumbnail_url") or "").strip()
        current_source = (entry.get("thumbnail_source") or "none").strip() or "none"
        if current_url:
            candidates.append(ThumbnailCandidate(url=current_url, source=current_source))
        candidates.extend(build_thumbnail_candidates(entry["live_url"], entry["source_url"]))

        selection = select_best_thumbnail(candidates)
        entry["thumbnail_url"] = selection["thumbnail_url"]
        entry["thumbnail_source"] = selection["thumbnail_source"]
        entry["thumbnail_quality"] = selection["thumbnail_quality"]

        status = selection["thumbnail_quality"]["status"]
        reason = selection["thumbnail_quality"]["reason"]
        source = selection["thumbnail_source"] or selection["thumbnail_quality"].get("source", "none")

        if entry["thumbnail_url"]:
            fetched += 1
            if status == "warn":
                warned += 1
                print(f"! ({source}, {reason})")
            else:
                print(f"✓ ({source})")
        else:
            failed += 1
            print(f"— ({reason})")

        if i < total - 1:
            time.sleep(REQUEST_DELAY)

    dataset_path.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(
        "Done. "
        f"Kept: {fetched}  Warn: {warned}  Failed: {failed}  Skipped: {skipped}"
    )
    return fetched, warned, failed, skipped


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--dataset",
        type=Path,
        action="append",
        help="Dataset path to enrich. Repeat to process multiple files.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-fetch even entries that already have thumbnail metadata.",
    )
    args = parser.parse_args()

    dataset_paths = args.dataset or [DATASET_PATH]
    total_fetched = total_warned = total_failed = total_skipped = 0
    for dataset_path in dataset_paths:
        fetched, warned, failed, skipped = enrich_dataset(dataset_path, args.force)
        total_fetched += fetched
        total_warned += warned
        total_failed += failed
        total_skipped += skipped

    if len(dataset_paths) > 1:
        print(
            "\nOverall. "
            f"Kept: {total_fetched}  Warn: {total_warned}  Failed: {total_failed}  Skipped: {total_skipped}"
        )

    try:
        run_post_write_maintenance(dataset_paths)
    except MaintenanceError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
