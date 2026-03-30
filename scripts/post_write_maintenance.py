#!/usr/bin/env python3
"""
Shared post-write maintenance for dataset-writing scripts.
"""

from __future__ import annotations

import json
from collections.abc import Iterable
from pathlib import Path

from dataset_catalog import (
    ROOT,
    DatasetValidationError,
    build_dataset_catalog,
    load_awwwards_catalog,
    load_awwwards_dataset_record,
    render_dataset_catalog_report,
)

CATALOG_OUTPUT = ROOT / "references" / "catalog.json"
WEB_CATALOG_OUTPUT = ROOT / "web" / "catalog-data.js"


class MaintenanceError(RuntimeError):
    pass


def _display_path(path: Path) -> str:
    try:
        return str(path.resolve().relative_to(ROOT))
    except ValueError:
        return str(path.resolve())


def validate_written_datasets(dataset_paths: Iterable[Path]) -> list[dict]:
    records: list[dict] = []

    for dataset_path in dataset_paths:
        resolved = dataset_path.resolve()
        print(f"Validating {_display_path(resolved)}")
        try:
            record = load_awwwards_dataset_record(resolved)
        except DatasetValidationError as exc:
            raise MaintenanceError(str(exc)) from exc

        records.append(record)
        print(
            f"PASS {record['filename']}: {record['entry_count']} entries, "
            f"thumbnails {record['thumbnail_coverage_count']}/{record['entry_count']} "
            f"({record['thumbnail_coverage_percentage']:.2f}%), "
            f"quality pass/warn/fail "
            f"{record['thumbnail_quality_pass_count']}/"
            f"{record['thumbnail_quality_warn_count']}/"
            f"{record['thumbnail_quality_fail_count']}"
        )

    return records


def rebuild_dataset_catalog(output: Path = CATALOG_OUTPUT) -> dict:
    try:
        catalog = build_dataset_catalog()
    except DatasetValidationError as exc:
        raise MaintenanceError(f"Catalog rebuild failed during validation:\n{exc}") from exc

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(catalog, indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )

    print(render_dataset_catalog_report(catalog))
    print(f"Wrote {_display_path(output)}")
    return catalog


def rebuild_web_catalog_bundle(output: Path = WEB_CATALOG_OUTPUT) -> dict:
    try:
        catalog = load_awwwards_catalog()
    except DatasetValidationError as exc:
        raise MaintenanceError(f"Static bundle regeneration failed during validation:\n{exc}") from exc

    payload = json.dumps(catalog, separators=(",", ":"), ensure_ascii=True)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(f"window.__DESIGN_REFS_CATALOG__ = {payload};\n", encoding="utf-8")
    print(f"Wrote {_display_path(output)} with {len(catalog.get('entries', []))} entries")
    return catalog


def run_post_write_maintenance(dataset_paths: Iterable[Path]) -> None:
    paths = [Path(path).resolve() for path in dataset_paths]
    if not paths:
        raise MaintenanceError("No dataset paths were provided for post-write maintenance.")

    print("\nRunning post-write maintenance...")
    validate_written_datasets(paths)
    rebuild_dataset_catalog()
    rebuild_web_catalog_bundle()
