#!/usr/bin/env python3
"""
Generate a machine-readable catalog for all local Awwwards datasets.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from dataset_catalog import (
    DatasetValidationError,
    ROOT,
    build_dataset_catalog,
    render_dataset_catalog_report,
)

DEFAULT_OUTPUT = ROOT / "references" / "catalog.json"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="Output catalog path. Defaults to references/catalog.json.",
    )
    args = parser.parse_args()

    try:
        catalog = build_dataset_catalog()
    except DatasetValidationError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(catalog, indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )

    print(render_dataset_catalog_report(catalog))
    print(f"\nWrote {args.output.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
