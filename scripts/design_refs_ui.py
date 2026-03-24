#!/usr/bin/env python3
"""
Local browser UI for the design-awards inspiration catalog.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import random
import re
import subprocess
import sys
import threading
import webbrowser
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from dataset_catalog import load_awwwards_catalog

ROOT = Path(__file__).resolve().parent.parent
WEB_DIR = ROOT / "web"
SEARCH_SCRIPT = ROOT / "scripts" / "find_design_refs.py"

FOCUS_PRESETS = {
    "all": {
        "label": "All",
        "description": "Let the natural-language query steer the results.",
        "categories": [],
        "query_terms": [],
    },
    "web-interactive": {
        "label": "Web & Interactive",
        "description": "Broader digital-experience references.",
        "categories": ["Web & Interactive"],
        "query_terms": ["web"],
    },
    "mobile-ui": {
        "label": "Mobile & UI",
        "description": "UI-heavy and product-oriented references.",
        "categories": [],
        "query_terms": ["app-ui", "onboarding"],
    },
    "technology": {
        "label": "Technology",
        "description": "Startup, SaaS, and product storytelling references.",
        "categories": ["Technology"],
        "query_terms": ["saas"],
    },
    "architecture": {
        "label": "Architecture",
        "description": "Spatial, gallery-like, and architectural presentation work.",
        "categories": ["Architecture"],
        "query_terms": ["architecture", "minimalist"],
    },
    "luxury": {
        "label": "Luxury",
        "description": "Premium, polished, image-led references.",
        "categories": ["Luxury"],
        "query_terms": ["luxury", "premium"],
    },
    "e-commerce": {
        "label": "E-Commerce",
        "description": "Commerce, product, and checkout-oriented references.",
        "categories": ["E-Commerce"],
        "query_terms": ["checkout"],
    },
    "typography": {
        "label": "Typography",
        "description": "Type-led, editorial, and lettering-forward references.",
        "categories": [],
        "query_terms": ["typography", "editorial", "type-led"],
    },
    "color": {
        "label": "Color & Palette",
        "description": "Bold, expressive, or distinctive use of color.",
        "categories": [],
        "query_terms": ["colorful", "bold-color", "gradient"],
    },
    "motion": {
        "label": "Motion & Animation",
        "description": "Animation-rich, scroll-driven, and motion-forward work.",
        "categories": [],
        "query_terms": ["motion", "animation", "scroll-driven", "parallax"],
    },
    "dark": {
        "label": "Dark Mode",
        "description": "Dark-background, cinematic, and night-mode aesthetics.",
        "categories": [],
        "query_terms": ["dark", "dark-mode", "cinematic"],
    },
    "minimal": {
        "label": "Minimal",
        "description": "Clean, restrained, whitespace-first design.",
        "categories": [],
        "query_terms": ["minimalist", "minimal", "clean"],
    },
    "3d": {
        "label": "3D & Immersive",
        "description": "Three-dimensional, WebGL, and spatially immersive work.",
        "categories": [],
        "query_terms": ["3d", "webgl", "immersive", "spatial"],
    },
    "portfolio": {
        "label": "Portfolio & Studio",
        "description": "Agency, creative studio, and personal portfolio work.",
        "categories": [],
        "query_terms": ["portfolio", "agency", "studio"],
    },
}

QUERY_HINTS = {
    "app": ["app-ui"],
    "apps": ["app-ui"],
    "architecture": ["architecture"],
    "brutalist": ["brutalist"],
    "checkout": ["checkout"],
    "dashboard": ["dashboard"],
    "editorial": ["editorial"],
    "fintech": ["fintech"],
    "immersive": ["immersive"],
    "landing page": ["landing-page"],
    "luxury": ["luxury"],
    "mobile": ["app-ui"],
    "motion": ["motion"],
    "onboarding": ["onboarding"],
    "portfolio": ["portfolio"],
    "premium": ["premium"],
    "saas": ["saas"],
}


class SearchError(RuntimeError):
    pass


def compute_similarity(base: dict, candidate: dict) -> float:
    base_terms = (
        set(base.get("categories", []))
        | set(base.get("style_tags", []))
        | set(base.get("tech_tags", []))
    )
    cand_terms = (
        set(candidate.get("categories", []))
        | set(candidate.get("style_tags", []))
        | set(candidate.get("tech_tags", []))
    )
    shared = base_terms & cand_terms
    union = base_terms | cand_terms
    return len(shared) / len(union) if union else 0.0


DESIGN_CATEGORIES = {
    "Web & Interactive", "Design Agencies", "Experimental",
    "Art & Illustration", "Architecture", "Technology",
    "Startups", "Culture & Education", "Photography",
    "E-Commerce", "Mobile & Apps", "Magazine / Newspaper / Blog",
}

def get_discover(limit: int = 100) -> list[dict]:
    data = load_dataset()
    entries = [
        e for e in data["entries"]
        if e.get("thumbnail_url")
        and DESIGN_CATEGORIES & set(e.get("categories", []))
    ]
    shuffled = entries[:]
    random.shuffle(shuffled)
    return shuffled[:limit]


def get_ref(slug: str) -> dict | None:
    data = load_dataset()
    entries = data["entries"]
    entry = next((e for e in entries if e.get("slug") == slug), None)
    if entry is None:
        return None
    scored = [
        (compute_similarity(entry, c), c)
        for c in entries
        if c.get("slug") != slug
    ]
    scored.sort(key=lambda pair: (-pair[0], pair[1].get("rank", 999)))
    return {**entry, "related": [c for score, c in scored[:4] if score > 0]}


def load_dataset() -> dict:
    return load_awwwards_catalog()


VISION_PROMPT = """You are a design analyst. Look at this screenshot or design reference image and describe it using the vocabulary below.

Return ONLY a JSON object with these keys:
- "query": a 6-12 word natural-language description of the design style and purpose (e.g. "dark editorial portfolio with bold typography and scroll animations")
- "style_tags": list of matching tags from: minimal, bold, dark, light, colorful, editorial, brutalist, luxury, premium, playful, elegant, technical, immersive, cinematic, gradient, glassmorphism, flat, 3d, motion, animated, typographic, image-led, grid-based, full-bleed, monochrome
- "tech_tags": list from: webgl, gsap, scroll-driven, parallax, canvas, svg, lottie, video-bg, react, vue
- "mood": one of: calm, energetic, sophisticated, playful, dramatic, minimal, bold

Return valid JSON only, no markdown fences."""


def analyze_image_with_claude(image_bytes: bytes, media_type: str) -> dict:
    """Send image to Claude Haiku and get design tags back."""
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        raise SearchError("ANTHROPIC_API_KEY not set — image search requires the Anthropic API key.")

    try:
        import urllib.request
    except ImportError as exc:
        raise SearchError("urllib not available") from exc

    b64 = base64.standard_b64encode(image_bytes).decode("ascii")
    body = json.dumps({
        "model": "claude-haiku-4-5",
        "max_tokens": 512,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": b64}},
                    {"type": "text", "text": VISION_PROMPT},
                ],
            }
        ],
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=body,
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            raw = json.loads(resp.read())
    except Exception as exc:
        raise SearchError(f"Claude API error: {exc}") from exc

    text = raw["content"][0]["text"].strip()
    # Strip markdown fences if Claude added them despite instructions
    text = re.sub(r"^```[a-z]*\n?", "", text).rstrip("`").strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise SearchError(f"Could not parse Claude response: {text[:200]}") from exc


def run_image_search(image_bytes: bytes, media_type: str, limit: int = 8) -> dict:
    """Analyze image with Claude then run catalog search with extracted tags."""
    vision = analyze_image_with_claude(image_bytes, media_type)

    query = vision.get("query", "")
    style_tags = vision.get("style_tags", [])
    tech_tags = vision.get("tech_tags", [])

    # Build fake params dict that build_search_request understands
    params: dict[str, list[str]] = {"limit": [str(limit)]}
    if query:
        params["q"] = [query]
    for tag in style_tags:
        params.setdefault("style", []).append(tag)
    for tag in tech_tags:
        params.setdefault("tech", []).append(tag)

    payload = run_search(params)
    payload["vision"] = {"query": query, "style_tags": style_tags, "tech_tags": tech_tags, "mood": vision.get("mood", "")}
    return payload


def list_values(entries: list[dict], key: str) -> list[str]:
    return sorted({value for entry in entries for value in entry.get(key, [])})


def get_options() -> dict:
    data = load_dataset()
    entries = data["entries"]
    return {
        "dataset": data["dataset"],
        "datasets": data.get("datasets", []),
        "focus": [
            {"key": key, "label": value["label"], "description": value["description"]}
            for key, value in FOCUS_PRESETS.items()
        ],
        "categories": list_values(entries, "categories"),
        "styles": list_values(entries, "style_tags"),
        "tech": list_values(entries, "tech_tags"),
    }


def first_value(params: dict[str, list[str]], key: str, default: str = "") -> str:
    value = params.get(key, [default])[0]
    return value.strip()


def split_values(values: list[str]) -> list[str]:
    items: list[str] = []
    for value in values:
        for piece in value.split(","):
            piece = piece.strip()
            if piece:
                items.append(piece)
    return items


def unique_values(values: list[str]) -> list[str]:
    return list(dict.fromkeys(value for value in values if value))


def normalize_phrase(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def extract_hint_terms(query: str) -> list[str]:
    normalized_query = normalize_phrase(query)
    hint_terms: list[str] = []
    for phrase, aliases in QUERY_HINTS.items():
        if phrase in normalized_query:
            hint_terms.extend(aliases)
    return unique_values(hint_terms)


def clamp_limit(raw_value: str) -> int:
    try:
        limit = int(raw_value)
    except ValueError as exc:
        raise SearchError("limit must be an integer") from exc
    return max(1, min(limit, 24))


def build_search_request(params: dict[str, list[str]]) -> dict:
    query = first_value(params, "q")
    similar_to = first_value(params, "similar_to")
    focus_key = first_value(params, "focus", "all") or "all"
    focus = FOCUS_PRESETS.get(focus_key, FOCUS_PRESETS["all"])

    manual_categories = split_values(params.get("category", []))
    styles = split_values(params.get("style", []))
    techs = split_values(params.get("tech", []))
    limit = clamp_limit(first_value(params, "limit", "8"))
    hint_terms = extract_hint_terms(query)

    categories = unique_values([*focus["categories"], *manual_categories])
    expanded_query_parts = unique_values([query, *focus["query_terms"], *hint_terms])
    effective_query = " ".join(expanded_query_parts).strip()

    command = [sys.executable, str(SEARCH_SCRIPT), "--json", "--limit", str(limit)]

    for category in categories:
        command.extend(["--category", category])
    for style in styles:
        command.extend(["--style", style])
    for tech in techs:
        command.extend(["--tech", tech])
    if similar_to:
        command.extend(["--similar-to", similar_to])
    if effective_query:
        command.append(effective_query)

    filters = {
        "query": query,
        "similar_to": similar_to,
        "focus": focus_key,
        "focus_label": focus["label"],
        "category": categories,
        "style": styles,
        "tech": techs,
        "limit": limit,
    }
    assistant = {
        "focus_label": focus["label"],
        "hint_terms": hint_terms,
        "effective_query": effective_query,
        "summary": build_assistant_summary(filters, hint_terms),
    }
    return {"command": command, "filters": filters, "assistant": assistant}


def build_assistant_summary(filters: dict, hint_terms: list[str]) -> str:
    parts: list[str] = []
    if filters["query"]:
        parts.append(f'You described "{filters["query"]}".')
    else:
        parts.append("You are browsing the catalog.")

    if filters["focus_label"] != "All":
        parts.append(f'I used the {filters["focus_label"]} lens.')

    if hint_terms:
        readable_terms = ", ".join(term.replace("-", " ") for term in hint_terms)
        parts.append(f"I also nudged the search toward {readable_terms}.")

    if filters["category"] or filters["style"] or filters["tech"]:
        active: list[str] = []
        if filters["category"]:
            active.append(f'categories: {", ".join(filters["category"])}')
        if filters["style"]:
            active.append(f'styles: {", ".join(filters["style"])}')
        if filters["tech"]:
            active.append(f'tech: {", ".join(filters["tech"])}')
        parts.append(f'Advanced filters applied: {" | ".join(active)}.')

    return " ".join(parts)


def run_search(params: dict[str, list[str]]) -> dict:
    request = build_search_request(params)
    command = request["command"]
    completed = subprocess.run(
        command,
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    if completed.returncode != 0:
        message = completed.stderr.strip() or "search failed"
        raise SearchError(message)

    payload = json.loads(completed.stdout)
    payload["filters"] = request["filters"]
    payload["assistant"] = request["assistant"]
    return payload


def humanize_reason(reason: str) -> str:
    parts: list[str] = []
    for raw_part in reason.split(","):
        part = raw_part.strip()
        kind, _, value = part.partition(":")
        if value:
            parts.append(f"{kind} {value}")
        elif part:
            parts.append(part)
    return ", ".join(parts)


def request_summary(filters: dict) -> str:
    summary: list[str] = []
    if filters["query"]:
        summary.append(f'query "{filters["query"]}"')
    if filters["focus_label"] != "All":
        summary.append(f'focus "{filters["focus_label"]}"')
    if filters["similar_to"]:
        summary.append(f'similar to "{filters["similar_to"]}"')
    if filters["category"]:
        summary.append(f'categories: {", ".join(filters["category"])}')
    if filters["style"]:
        summary.append(f'styles: {", ".join(filters["style"])}')
    if filters["tech"]:
        summary.append(f'tech: {", ".join(filters["tech"])}')
    return " | ".join(summary) if summary else "top references"


def build_markdown(payload: dict) -> str:
    filters = payload["filters"]
    lines = [
        f"# Design Reference Pack: {request_summary(filters)}",
        "",
        f"Dataset: {payload['dataset']}",
        "",
        "References:",
    ]

    for result in payload["results"]:
        lines.extend(
            [
                f"- {result['title']} ({result['award_date']})",
                f"  Live: {result['live_url']}",
                f"  Source: {result['source_url']}",
                f"  Why it fits: matched {humanize_reason(result['match_reason'])}",
                f"  Categories: {', '.join(result['categories']) or '-'}",
                f"  Style: {', '.join(result['style_tags']) or '-'}",
                f"  Tech: {', '.join(result['tech_tags']) or '-'}",
                "",
            ]
        )

    return "\n".join(lines).rstrip() + "\n"


class DesignRefsHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIR), **kwargs)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/search-by-image":
            self.handle_image_search()
            return
        self.send_response(HTTPStatus.METHOD_NOT_ALLOWED)
        self.end_headers()

    def handle_image_search(self) -> None:
        content_type = self.headers.get("Content-Type", "")
        content_length = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(content_length)

        # Determine image media type from Content-Type header or default to jpeg
        if "png" in content_type:
            media_type = "image/png"
        elif "gif" in content_type:
            media_type = "image/gif"
        elif "webp" in content_type:
            media_type = "image/webp"
        else:
            media_type = "image/jpeg"

        # If multipart form, extract the file bytes
        if "multipart/form-data" in content_type:
            import email
            boundary = content_type.split("boundary=")[-1].encode()
            parts = raw_body.split(b"--" + boundary)
            image_bytes = b""
            for part in parts:
                if b"Content-Disposition" in part and b'name="image"' in part:
                    # Find content after the blank line
                    split = part.split(b"\r\n\r\n", 1)
                    if len(split) == 2:
                        image_bytes = split[1].rstrip(b"\r\n--")
                        if b"image/png" in part:
                            media_type = "image/png"
                        elif b"image/gif" in part:
                            media_type = "image/gif"
                        elif b"image/webp" in part:
                            media_type = "image/webp"
                        else:
                            media_type = "image/jpeg"
                        break
        else:
            image_bytes = raw_body

        if not image_bytes:
            self.write_json(HTTPStatus.BAD_REQUEST, {"error": "No image data received."})
            return

        # Optional limit param from query string
        params = parse_qs(urlparse(self.path).query)
        limit = 8
        try:
            limit = max(1, min(int(first_value(params, "limit", "8")), 24))
        except ValueError:
            pass

        try:
            payload = run_image_search(image_bytes, media_type, limit)
        except SearchError as exc:
            self.write_json(HTTPStatus.BAD_REQUEST, {"error": str(exc)})
            return
        self.write_json(HTTPStatus.OK, payload)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/options":
            self.handle_options()
            return
        if parsed.path == "/api/search":
            self.handle_search(parsed.query)
            return
        if parsed.path == "/api/export.md":
            self.handle_markdown_export(parsed.query)
            return
        if parsed.path.startswith("/api/ref/"):
            slug = parsed.path[len("/api/ref/"):]
            self.handle_ref(slug)
            return
        if parsed.path == "/api/discover":
            self.handle_discover(parsed.query)
            return

        self.path = "/index.html" if parsed.path == "/" else parsed.path
        super().do_GET()

    def handle_discover(self, query: str) -> None:
        params = parse_qs(query)
        raw_limit = first_value(params, "limit", "100")
        try:
            limit = max(1, min(int(raw_limit), 200))
        except ValueError:
            limit = 100
        entries = get_discover(limit)
        self.write_json(HTTPStatus.OK, {"entries": entries, "count": len(entries)})

    def handle_ref(self, slug: str) -> None:
        ref = get_ref(slug)
        if ref is None:
            self.write_json(HTTPStatus.NOT_FOUND, {"error": f'Reference "{slug}" not found'})
            return
        self.write_json(HTTPStatus.OK, ref)

    def handle_options(self) -> None:
        self.write_json(HTTPStatus.OK, get_options())

    def handle_search(self, query: str) -> None:
        params = parse_qs(query)
        try:
            payload = run_search(params)
        except SearchError as exc:
            self.write_json(HTTPStatus.BAD_REQUEST, {"error": str(exc)})
            return
        self.write_json(HTTPStatus.OK, payload)

    def handle_markdown_export(self, query: str) -> None:
        params = parse_qs(query)
        try:
            payload = run_search(params)
        except SearchError as exc:
            self.write_text(HTTPStatus.BAD_REQUEST, str(exc), "text/plain; charset=utf-8")
            return

        self.write_text(
            HTTPStatus.OK,
            build_markdown(payload),
            "text/markdown; charset=utf-8",
        )

    def write_json(self, status: HTTPStatus, payload: dict) -> None:
        body = json.dumps(payload, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def write_text(self, status: HTTPStatus, body: str, content_type: str) -> None:
        encoded = body.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=5827)
    parser.add_argument("--no-open", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    server = ThreadingHTTPServer(
        (args.host, args.port),
        partial(DesignRefsHandler),
    )
    url = f"http://{args.host}:{args.port}"

    print(f"Design refs UI running at {url}")
    if not args.no_open:
        threading.Timer(0.5, lambda: webbrowser.open(url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping design refs UI")
    finally:
        server.server_close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
