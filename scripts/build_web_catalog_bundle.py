#!/usr/bin/env python3
"""
Generate a static catalog bundle so the web app can run without the Python API.
"""

from __future__ import annotations

import sys

from post_write_maintenance import MaintenanceError, rebuild_web_catalog_bundle


def main() -> int:
    try:
        rebuild_web_catalog_bundle()
    except MaintenanceError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
