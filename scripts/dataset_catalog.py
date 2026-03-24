#!/usr/bin/env python3
"""
Shared helpers for validating, summarizing, and loading local Awwwards datasets.
"""

from __future__ import annotations

import json
import re
from datetime import date
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
REFERENCES_DIR = ROOT / "references"
AWWWARDS_SOURCE = "Awwwards Site of the Day"
AWWWARDS_DATASET_GLOB = "awwwards-sotd-*.json"
YEAR_PATTERN = re.compile(r"awwwards-sotd-(\d{4})\.json$")
REQUIRED_TOP_LEVEL_KEYS = (
    "dataset",
    "generated_on",
    "target_year",
    "source_archive",
    "methodology",
    "entries",
)
REQUIRED_ENTRY_FIELDS = (
    "title",
    "slug",
    "live_url",
    "source_url",
    "award_date",
    "rank",
)
ARRAY_FIELDS = ("categories", "style_tags", "tech_tags", "tags")
URL_FIELDS = ("live_url", "source_url")
OPTIONAL_URL_FIELDS = ("thumbnail_url",)


class DatasetValidationError(RuntimeError):
    def __init__(self, path: Path, errors: list[str]):
        self.path = path
        self.errors = errors
        super().__init__(format_validation_error(path, errors))


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def parse_year(path: Path) -> int:
    match = YEAR_PATTERN.search(path.name)
    if not match:
        raise ValueError(f"Could not parse year from dataset filename: {path.name}")
    return int(match.group(1))


def list_awwwards_datasets() -> list[Path]:
    paths = sorted(
        REFERENCES_DIR.glob(AWWWARDS_DATASET_GLOB),
        key=parse_year,
        reverse=True,
    )
    if not paths:
        raise FileNotFoundError(
            f"No Awwwards datasets found in {REFERENCES_DIR} matching {AWWWARDS_DATASET_GLOB}"
        )
    return paths


def build_catalog_label(years: list[int], total_entries: int) -> str:
    if not years:
        return f"{AWWWARDS_SOURCE} ({total_entries} entries)"
    if len(years) == 1:
        return f"{AWWWARDS_SOURCE} {years[0]} ({total_entries} entries)"
    return (
        f"{AWWWARDS_SOURCE} {min(years)}-{max(years)} "
        f"({total_entries} entries across {len(years)} years)"
    )


def format_validation_error(path: Path, errors: list[str]) -> str:
    header = f"Dataset validation failed for {path}"
    details = "\n".join(f"  - {error}" for error in errors)
    return f"{header}\n{details}"


def _coverage_percentage(count: int, total: int) -> float:
    if total <= 0:
        return 0.0
    return round((count / total) * 100, 2)


def _validate_non_empty_string(value: Any, field: str, errors: list[str]) -> str:
    if not isinstance(value, str):
        errors.append(f"{field}: expected string, got {type(value).__name__}")
        return ""
    cleaned = value.strip()
    if not cleaned:
        errors.append(f"{field}: expected non-empty string")
    return cleaned


def _validate_optional_string(value: Any, field: str, errors: list[str]) -> str:
    if value is None:
        return ""
    if not isinstance(value, str):
        errors.append(f"{field}: expected string when present, got {type(value).__name__}")
        return ""
    return value.strip()


def _validate_array(value: Any, field: str, errors: list[str]) -> list[str]:
    if not isinstance(value, list):
        errors.append(f"{field}: expected array, got {type(value).__name__}")
        return []

    normalized: list[str] = []
    for index, item in enumerate(value):
        if not isinstance(item, str):
            errors.append(f"{field}[{index}]: expected string, got {type(item).__name__}")
            continue
        normalized.append(item.strip())
    return normalized


def _validate_iso_date(value: Any, field: str, errors: list[str]) -> str:
    text = _validate_non_empty_string(value, field, errors)
    if not text:
        return ""
    try:
        date.fromisoformat(text)
    except ValueError:
        errors.append(f"{field}: expected ISO date (YYYY-MM-DD), got {text!r}")
    return text


def _validate_rank(value: Any, field: str, errors: list[str]) -> int | None:
    if not isinstance(value, int):
        errors.append(f"{field}: expected integer, got {type(value).__name__}")
        return None
    if value <= 0:
        errors.append(f"{field}: expected positive integer, got {value}")
    return value


def validate_dataset_payload(data: Any, *, path: Path) -> dict[str, Any]:
    errors: list[str] = []
    filename_year = parse_year(path)

    if not isinstance(data, dict):
        raise DatasetValidationError(path, [f"root: expected object, got {type(data).__name__}"])

    normalized: dict[str, Any] = dict(data)

    for key in REQUIRED_TOP_LEVEL_KEYS:
        if key not in data:
            errors.append(f"root: missing top-level key {key!r}")

    normalized["dataset"] = _validate_non_empty_string(data.get("dataset"), "dataset", errors)
    normalized["generated_on"] = _validate_iso_date(data.get("generated_on"), "generated_on", errors)
    normalized["source_archive"] = _validate_non_empty_string(data.get("source_archive"), "source_archive", errors)
    normalized["methodology"] = _validate_non_empty_string(data.get("methodology"), "methodology", errors)

    target_year = data.get("target_year")
    if not isinstance(target_year, int):
        errors.append(f"target_year: expected integer, got {type(target_year).__name__}")
        normalized["target_year"] = filename_year
    else:
        normalized["target_year"] = target_year
        if target_year != filename_year:
            errors.append(
                f"target_year: expected {filename_year} to match filename {path.name}, got {target_year}"
            )

    raw_entries = data.get("entries")
    if not isinstance(raw_entries, list):
        errors.append(f"entries: expected array, got {type(raw_entries).__name__}")
        raw_entries = []

    seen_slugs: set[str] = set()
    normalized_entries: list[dict[str, Any]] = []
    for index, raw_entry in enumerate(raw_entries):
        prefix = f"entries[{index}]"
        if not isinstance(raw_entry, dict):
            errors.append(f"{prefix}: expected object, got {type(raw_entry).__name__}")
            continue

        entry = dict(raw_entry)
        for key in REQUIRED_ENTRY_FIELDS:
            if key not in raw_entry:
                errors.append(f"{prefix}: missing required field {key!r}")

        entry["title"] = _validate_non_empty_string(raw_entry.get("title"), f"{prefix}.title", errors)
        entry["slug"] = _validate_non_empty_string(raw_entry.get("slug"), f"{prefix}.slug", errors)
        entry["live_url"] = _validate_non_empty_string(raw_entry.get("live_url"), f"{prefix}.live_url", errors)
        entry["source_url"] = _validate_non_empty_string(raw_entry.get("source_url"), f"{prefix}.source_url", errors)
        entry["award_date"] = _validate_iso_date(raw_entry.get("award_date"), f"{prefix}.award_date", errors)
        entry["rank"] = _validate_rank(raw_entry.get("rank"), f"{prefix}.rank", errors)
        entry["thumbnail_url"] = _validate_optional_string(
            raw_entry.get("thumbnail_url"),
            f"{prefix}.thumbnail_url",
            errors,
        )

        for key in URL_FIELDS:
            value = entry.get(key, "")
            if isinstance(value, str) and not value:
                errors.append(f"{prefix}.{key}: expected non-empty string")

        for key in OPTIONAL_URL_FIELDS:
            value = entry.get(key, "")
            if not isinstance(value, str):
                errors.append(f"{prefix}.{key}: expected string when present, got {type(value).__name__}")

        for key in ARRAY_FIELDS:
            entry[key] = _validate_array(raw_entry.get(key), f"{prefix}.{key}", errors)

        award_year = raw_entry.get("award_year")
        if award_year is not None:
            if not isinstance(award_year, int):
                errors.append(f"{prefix}.award_year: expected integer, got {type(award_year).__name__}")
            elif award_year != normalized["target_year"]:
                errors.append(
                    f"{prefix}.award_year: expected {normalized['target_year']}, got {award_year}"
                )

        slug = entry["slug"]
        if slug:
            if slug in seen_slugs:
                errors.append(f"{prefix}.slug: duplicate slug {slug!r}")
            seen_slugs.add(slug)

        normalized_entries.append(entry)

    normalized["entries"] = normalized_entries

    if errors:
        raise DatasetValidationError(path, errors)
    return normalized


def normalize_entry(entry: dict[str, Any], *, year: int, filename: str) -> dict[str, Any]:
    normalized = dict(entry)
    normalized["dataset_file"] = filename
    normalized["dataset_year"] = year
    normalized["source_rank"] = entry.get("rank")
    normalized["thumbnail_url"] = normalized.get("thumbnail_url", "") or ""
    return normalized


def load_awwwards_dataset_record(path: Path) -> dict[str, Any]:
    payload = validate_dataset_payload(load_json(path), path=path)
    year = parse_year(path)
    entries = [normalize_entry(entry, year=year, filename=path.name) for entry in payload["entries"]]
    thumbnail_count = sum(1 for entry in entries if entry.get("thumbnail_url"))
    entry_count = len(entries)
    return {
        "path": path,
        "filename": path.name,
        "source": AWWWARDS_SOURCE,
        "year": year,
        "label": payload["dataset"],
        "generated_on": payload.get("generated_on", ""),
        "entry_count": entry_count,
        "thumbnail_coverage_count": thumbnail_count,
        "thumbnail_coverage_percentage": _coverage_percentage(thumbnail_count, entry_count),
        "validation_status": "pass",
        "validation_errors": [],
        "payload": payload,
        "entries": entries,
    }


def _record_to_dataset_summary(record: dict[str, Any]) -> dict[str, Any]:
    return {
        "filename": record["filename"],
        "file": record["filename"],
        "source": record["source"],
        "year": record["year"],
        "dataset": record["label"],
        "label": record["label"],
        "entry_count": record["entry_count"],
        "count": record["entry_count"],
        "generated_on": record["generated_on"],
        "thumbnail_coverage_count": record["thumbnail_coverage_count"],
        "thumbnail_coverage_percentage": record["thumbnail_coverage_percentage"],
        "validation_status": record["validation_status"],
    }


def build_dataset_catalog(paths: list[Path] | None = None) -> dict[str, Any]:
    dataset_paths = paths or list_awwwards_datasets()
    records = [load_awwwards_dataset_record(path) for path in dataset_paths]
    years = sorted(record["year"] for record in records)
    total_entries = sum(record["entry_count"] for record in records)
    total_thumbnails = sum(record["thumbnail_coverage_count"] for record in records)

    return {
        "source": AWWWARDS_SOURCE,
        "dataset_glob": AWWWARDS_DATASET_GLOB,
        "catalog_label": build_catalog_label(years, total_entries),
        "datasets": [
            _record_to_dataset_summary(record)
            for record in sorted(records, key=lambda item: item["year"], reverse=True)
        ],
        "totals": {
            "dataset_count": len(records),
            "entry_count": total_entries,
            "thumbnail_coverage_count": total_thumbnails,
            "thumbnail_coverage_percentage": _coverage_percentage(total_thumbnails, total_entries),
        },
    }


def render_dataset_catalog_report(catalog: dict[str, Any]) -> str:
    totals = catalog["totals"]
    lines = [
        (
            f"Awwwards dataset catalog: {totals['dataset_count']} files, "
            f"{totals['entry_count']} total entries"
        )
    ]
    for dataset in catalog.get("datasets", []):
        lines.append(
            "- "
            f"{dataset['year']}: {dataset['entry_count']} entries | "
            f"thumbnails {dataset['thumbnail_coverage_count']}/{dataset['entry_count']} "
            f"({dataset['thumbnail_coverage_percentage']:.2f}%) | "
            f"validation {dataset['validation_status']} | "
            f"{dataset['filename']}"
        )
    return "\n".join(lines)


def combine_awwwards_datasets(paths: list[Path]) -> dict[str, Any]:
    records = [load_awwwards_dataset_record(path) for path in paths]
    years: list[int] = []
    entries: list[dict[str, Any]] = []

    for record in records:
        years.append(record["year"])
        entries.extend(record["entries"])

    entries.sort(key=lambda entry: entry.get("title", "").lower())
    entries.sort(key=lambda entry: entry.get("source_rank") or 0)
    entries.sort(key=lambda entry: entry.get("award_date", ""), reverse=True)

    for index, entry in enumerate(entries, start=1):
        entry["rank"] = index

    return {
        "dataset": build_catalog_label(sorted(years), len(entries)),
        "dataset_files": [record["filename"] for record in records],
        "dataset_years": sorted(years),
        "datasets": [
            _record_to_dataset_summary(record)
            for record in sorted(records, key=lambda item: item["year"], reverse=True)
        ],
        "entries": entries,
    }


def load_awwwards_catalog(dataset: Path | None = None) -> dict[str, Any]:
    if dataset is not None:
        record = load_awwwards_dataset_record(dataset)
        return {
            "dataset": record["label"],
            "dataset_files": [record["filename"]],
            "dataset_years": [record["year"]],
            "datasets": [_record_to_dataset_summary(record)],
            "entries": record["entries"],
        }

    return combine_awwwards_datasets(list_awwwards_datasets())
