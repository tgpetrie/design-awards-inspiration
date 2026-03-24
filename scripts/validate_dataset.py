#!/usr/bin/env python3
"""
Validate one or more local Awwwards dataset files.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from dataset_catalog import (
    DatasetValidationError,
    list_awwwards_datasets,
    load_awwwards_dataset_record,
)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "datasets",
        nargs="*",
        type=Path,
        help="Specific dataset paths to validate. Defaults to all local Awwwards datasets.",
    )
    args = parser.parse_args()

    dataset_paths = args.datasets or list_awwwards_datasets()
    failures = 0

    for dataset_path in dataset_paths:
        try:
            record = load_awwwards_dataset_record(dataset_path)
        except DatasetValidationError as exc:
            failures += 1
            print(str(exc), file=sys.stderr)
            continue

        print(
            f"PASS {record['filename']}: {record['entry_count']} entries, "
            f"thumbnails {record['thumbnail_coverage_count']}/{record['entry_count']} "
            f"({record['thumbnail_coverage_percentage']:.2f}%)"
        )

    if failures:
        print(f"\nValidation failed for {failures} dataset(s).", file=sys.stderr)
        return 1

    print(f"\nValidated {len(dataset_paths)} dataset(s) successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
