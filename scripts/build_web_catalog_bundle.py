#!/usr/bin/env python3
"""
Generate a static catalog bundle so the web app can run without the Python API.
"""

from __future__ import annotations

import json
from pathlib import Path

from dataset_catalog import load_awwwards_catalog

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "web" / "catalog-data.js"


def main() -> int:
    catalog = load_awwwards_catalog()
    payload = json.dumps(catalog, separators=(",", ":"), ensure_ascii=True)
    OUTPUT.write_text(f"window.__DESIGN_REFS_CATALOG__ = {payload};\n", encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)} with {len(catalog.get('entries', []))} entries")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
