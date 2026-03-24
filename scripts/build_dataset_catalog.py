#!/usr/bin/env python3
"""
Generate a machine-readable catalog for all local Awwwards datasets.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from dataset_catalog import ROOT
from post_write_maintenance import MaintenanceError, rebuild_dataset_catalog

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
        rebuild_dataset_catalog(args.output)
    except MaintenanceError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
