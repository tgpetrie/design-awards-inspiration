#!/usr/bin/env python3
"""
Shared helpers for loading one or more local award datasets.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REFERENCES_DIR = ROOT / "references"
AWWWARDS_DATASET_GLOB = "awwwards-sotd-*.json"
YEAR_PATTERN = re.compile(r"awwwards-sotd-(\d{4})\.json$")


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def parse_year(path: Path) -> int:
    match = YEAR_PATTERN.search(path.name)
    if not match:
        raise ValueError(f"Could not parse year from dataset filename: {path.name}")
    return int(match.group(1))


def list_awwwards_datasets() -> list[Path]:
    paths = sorted(
        REFERENCES_DIR.glob(AWWWARDS_DATASET_GLOB),
        key=lambda path: parse_year(path),
        reverse=True,
    )
    if not paths:
        raise FileNotFoundError(
            f"No Awwwards datasets found in {REFERENCES_DIR} matching {AWWWARDS_DATASET_GLOB}"
        )
    return paths


def build_catalog_label(years: list[int], total_entries: int) -> str:
    if not years:
        return f"Awwwards Site of the Day ({total_entries} entries)"
    if len(years) == 1:
        return f"Awwwards Site of the Day {years[0]} ({total_entries} entries)"
    return (
        f"Awwwards Site of the Day {min(years)}-{max(years)} "
        f"({total_entries} entries across {len(years)} years)"
    )


def normalize_entry(entry: dict, *, year: int, filename: str) -> dict:
    normalized = dict(entry)
    normalized["dataset_file"] = filename
    normalized["dataset_year"] = year
    normalized["source_rank"] = entry.get("rank")
    normalized.setdefault("thumbnail_url", "")
    return normalized


def combine_awwwards_datasets(paths: list[Path]) -> dict:
    datasets: list[dict] = []
    years: list[int] = []
    entries: list[dict] = []

    for path in paths:
        data = load_json(path)
        year = parse_year(path)
        years.append(year)
        datasets.append(
            {
                "file": path.name,
                "year": year,
                "label": data.get("dataset", path.stem),
                "count": len(data.get("entries", [])),
            }
        )
        for entry in data.get("entries", []):
            entries.append(normalize_entry(entry, year=year, filename=path.name))

    entries.sort(key=lambda entry: entry.get("title", "").lower())
    entries.sort(key=lambda entry: entry.get("source_rank") or 0)
    entries.sort(key=lambda entry: entry.get("award_date", ""), reverse=True)

    for index, entry in enumerate(entries, start=1):
        entry["rank"] = index

    return {
        "dataset": build_catalog_label(sorted(years), len(entries)),
        "dataset_files": [path.name for path in paths],
        "dataset_years": sorted(years),
        "datasets": sorted(datasets, key=lambda item: item["year"], reverse=True),
        "entries": entries,
    }


def load_awwwards_catalog(dataset: Path | None = None) -> dict:
    if dataset is not None:
        data = load_json(dataset)
        year = parse_year(dataset)
        entries = [
            normalize_entry(entry, year=year, filename=dataset.name)
            for entry in data.get("entries", [])
        ]
        return {
            "dataset": data.get("dataset", dataset.stem),
            "dataset_files": [dataset.name],
            "dataset_years": [year],
            "datasets": [
                {
                    "file": dataset.name,
                    "year": year,
                    "label": data.get("dataset", dataset.stem),
                    "count": len(data.get("entries", [])),
                }
            ],
            "entries": entries,
        }

    return combine_awwwards_datasets(list_awwwards_datasets())
