#!/usr/bin/env python3
"""
Thumbnail candidate analysis and quality gating for Awwwards datasets.
"""

from __future__ import annotations

import html
import math
import re
import urllib.request
from dataclasses import dataclass
from io import BytesIO
from typing import Any
from urllib.parse import urlparse

try:
    from PIL import Image, ImageFilter, ImageStat, UnidentifiedImageError
except ImportError as exc:
    raise SystemExit(
        "Pillow is required for thumbnail quality analysis. Install it with `python3 -m pip install -r requirements.txt`."
    ) from exc

ANALYSIS_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
}
ANALYSIS_SIZE = (256, 256)
MAX_IMAGE_BYTES = 6_000_000
DEFAULT_TIMEOUT = 20
DEFAULT_VIEWPORT = {"width": 1920, "height": 1080}
THUMBNAIL_QUALITY_RULES = {
    "min_width": 1100,
    "min_height": 580,
    "min_pixels": 900_000,
    "warn_width": 1600,
    "warn_height": 800,
    "max_cover_scale_pass": 1.6,
    "max_cover_scale_warn": 1.9,
    "min_entropy_fail": 2.3,
    "min_entropy_warn": 3.6,
    "min_edge_variance_fail": 170.0,
    "min_edge_variance_warn": 320.0,
    "max_near_white_fail": 0.72,
    "max_near_white_warn": 0.55,
    "min_aspect_ratio": 1.15,
    "max_aspect_ratio": 2.2,
}
SOURCE_BONUS = {
    "og:source": 28,
    "screenshot": 20,
    "og": 8,
    "none": 0,
}
SUSPICIOUS_PATH_TOKENS = {
    "avatar",
    "badge",
    "favicon",
    "icon",
    "icons",
    "logo",
    "logos",
    "logotype",
    "mark",
    "marks",
    "seal",
    "wordmark",
}


@dataclass(frozen=True)
class ThumbnailCandidate:
    url: str
    source: str


def normalize_thumbnail_url(url: str | None) -> str:
    return html.unescape((url or "").strip())


def build_empty_quality(*, reason: str, source: str = "none", url: str = "") -> dict[str, Any]:
    return {
        "status": "fail",
        "reason": reason,
        "score": 0,
        "source": source,
        "url": normalize_thumbnail_url(url),
        "width": 0,
        "height": 0,
        "pixels": 0,
        "aspect_ratio": 0.0,
        "cover_scale": 0.0,
        "entropy": 0.0,
        "edge_variance": 0.0,
        "near_white_ratio": 0.0,
        "suspicious_tokens": [],
    }


def _parse_tokens(url: str) -> list[str]:
    parsed = urlparse(url)
    tokens = set(re.findall(r"[a-z0-9]+", f"{parsed.path} {parsed.query}".lower()))
    return sorted(tokens & SUSPICIOUS_PATH_TOKENS)


def _entropy(gray: Image.Image) -> float:
    histogram = gray.histogram()
    total = sum(histogram) or 1
    return -sum((count / total) * math.log2(count / total) for count in histogram if count)


def _edge_variance(gray: Image.Image) -> float:
    laplacian = gray.filter(
        ImageFilter.Kernel(
            (3, 3),
            [-1, -1, -1, -1, 8, -1, -1, -1, -1],
            scale=1,
        )
    )
    return ImageStat.Stat(laplacian).var[0]


def analyze_thumbnail_url(
    url: str | None,
    *,
    source: str,
    timeout: int = DEFAULT_TIMEOUT,
) -> dict[str, Any]:
    cleaned_url = normalize_thumbnail_url(url)
    if not cleaned_url:
        return build_empty_quality(reason="missing-url", source=source, url=cleaned_url)

    try:
        request = urllib.request.Request(cleaned_url, headers=ANALYSIS_HEADERS)
        with urllib.request.urlopen(request, timeout=timeout) as response:
            payload = response.read(MAX_IMAGE_BYTES + 1)
            content_type = response.headers.get("Content-Type", "")
    except Exception as exc:
        return {
            **build_empty_quality(reason=f"fetch-error:{type(exc).__name__}", source=source, url=cleaned_url),
            "content_type": "",
        }

    truncated = len(payload) > MAX_IMAGE_BYTES
    payload = payload[:MAX_IMAGE_BYTES]

    try:
        image = Image.open(BytesIO(payload))
        image.load()
    except (UnidentifiedImageError, OSError) as exc:
        return {
            **build_empty_quality(reason=f"decode-error:{type(exc).__name__}", source=source, url=cleaned_url),
            "content_type": content_type,
            "byte_length": len(payload),
        }

    width, height = image.size
    rgb = image.convert("RGB")
    rgb.thumbnail(ANALYSIS_SIZE, Image.Resampling.LANCZOS)
    gray = rgb.convert("L")
    pixels = list(rgb.getdata())
    total_pixels = len(pixels) or 1
    near_white_ratio = sum(1 for r, g, b in pixels if r > 240 and g > 240 and b > 240) / total_pixels
    suspicious_tokens = _parse_tokens(cleaned_url)

    return {
        "status": "unknown",
        "reason": "analyzed",
        "score": 0,
        "source": source,
        "url": cleaned_url,
        "content_type": content_type,
        "byte_length": len(payload),
        "truncated": truncated,
        "format": image.format or "",
        "width": width,
        "height": height,
        "pixels": width * height,
        "aspect_ratio": round(width / max(height, 1), 4),
        "cover_scale": round(
            max(
                DEFAULT_VIEWPORT["width"] / max(width, 1),
                DEFAULT_VIEWPORT["height"] / max(height, 1),
            ),
            4,
        ),
        "entropy": round(_entropy(gray), 4),
        "edge_variance": round(_edge_variance(gray), 4),
        "near_white_ratio": round(near_white_ratio, 4),
        "suspicious_tokens": suspicious_tokens,
    }


def evaluate_thumbnail_quality(meta: dict[str, Any]) -> dict[str, Any]:
    if meta.get("status") == "fail":
        return meta

    width = int(meta.get("width") or 0)
    height = int(meta.get("height") or 0)
    pixels = int(meta.get("pixels") or 0)
    aspect_ratio = float(meta.get("aspect_ratio") or 0.0)
    cover_scale = float(meta.get("cover_scale") or 0.0)
    entropy = float(meta.get("entropy") or 0.0)
    edge_variance = float(meta.get("edge_variance") or 0.0)
    near_white_ratio = float(meta.get("near_white_ratio") or 0.0)
    suspicious_tokens = list(meta.get("suspicious_tokens") or [])

    fail_reasons: list[str] = []
    warn_reasons: list[str] = []

    if width < THUMBNAIL_QUALITY_RULES["min_width"]:
        fail_reasons.append(f"width<{THUMBNAIL_QUALITY_RULES['min_width']}")
    if height < THUMBNAIL_QUALITY_RULES["min_height"]:
        fail_reasons.append(f"height<{THUMBNAIL_QUALITY_RULES['min_height']}")
    if pixels < THUMBNAIL_QUALITY_RULES["min_pixels"]:
        fail_reasons.append(f"pixels<{THUMBNAIL_QUALITY_RULES['min_pixels']}")
    if cover_scale > THUMBNAIL_QUALITY_RULES["max_cover_scale_warn"]:
        fail_reasons.append(f"cover-scale>{THUMBNAIL_QUALITY_RULES['max_cover_scale_warn']}")
    if entropy < THUMBNAIL_QUALITY_RULES["min_entropy_fail"]:
        fail_reasons.append(f"entropy<{THUMBNAIL_QUALITY_RULES['min_entropy_fail']}")
    if edge_variance < THUMBNAIL_QUALITY_RULES["min_edge_variance_fail"] and entropy < 3.4:
        fail_reasons.append("low-detail")
    if near_white_ratio > THUMBNAIL_QUALITY_RULES["max_near_white_fail"]:
        fail_reasons.append("mostly-white")
    if suspicious_tokens and (near_white_ratio > 0.28 or entropy < 4.1 or width < 1500):
        fail_reasons.append("logo-like-path")

    if not fail_reasons:
        if width < THUMBNAIL_QUALITY_RULES["warn_width"]:
            warn_reasons.append(f"width<{THUMBNAIL_QUALITY_RULES['warn_width']}")
        if height < THUMBNAIL_QUALITY_RULES["warn_height"]:
            warn_reasons.append(f"height<{THUMBNAIL_QUALITY_RULES['warn_height']}")
        if cover_scale > THUMBNAIL_QUALITY_RULES["max_cover_scale_pass"]:
            warn_reasons.append(f"cover-scale>{THUMBNAIL_QUALITY_RULES['max_cover_scale_pass']}")
        if entropy < THUMBNAIL_QUALITY_RULES["min_entropy_warn"]:
            warn_reasons.append(f"entropy<{THUMBNAIL_QUALITY_RULES['min_entropy_warn']}")
        if edge_variance < THUMBNAIL_QUALITY_RULES["min_edge_variance_warn"]:
            warn_reasons.append(f"edge-variance<{THUMBNAIL_QUALITY_RULES['min_edge_variance_warn']}")
        if near_white_ratio > THUMBNAIL_QUALITY_RULES["max_near_white_warn"]:
            warn_reasons.append("mostly-white")
        if aspect_ratio < THUMBNAIL_QUALITY_RULES["min_aspect_ratio"]:
            warn_reasons.append("aspect-too-tall")
        elif aspect_ratio > THUMBNAIL_QUALITY_RULES["max_aspect_ratio"]:
            warn_reasons.append("aspect-too-wide")
        if suspicious_tokens:
            warn_reasons.append("suspicious-path")

    score = SOURCE_BONUS.get(str(meta.get("source") or "none"), 0)
    score += min(width, 2400) // 80
    score += min(height, 1600) // 80
    score += int(min(max(entropy, 0.0), 7.5) * 5)
    score += int(min(max(edge_variance, 0.0), 6000.0) / 250)
    score -= int(max(near_white_ratio - 0.4, 0.0) * 120)
    if suspicious_tokens:
        score -= 28
    if fail_reasons:
        score -= 60
    elif warn_reasons:
        score -= 18

    status = "pass"
    reason = "ok"
    if fail_reasons:
        status = "fail"
        reason = fail_reasons[0]
    elif warn_reasons:
        status = "warn"
        reason = warn_reasons[0]

    return {
        **meta,
        "status": status,
        "reason": reason,
        "score": max(int(score), 0),
        "warnings": warn_reasons,
        "failures": fail_reasons,
    }


def analyze_thumbnail_candidate(candidate: ThumbnailCandidate) -> dict[str, Any]:
    return evaluate_thumbnail_quality(analyze_thumbnail_url(candidate.url, source=candidate.source))


def select_best_thumbnail(candidates: list[ThumbnailCandidate]) -> dict[str, Any]:
    analyzed = [analyze_thumbnail_candidate(candidate) for candidate in candidates if normalize_thumbnail_url(candidate.url)]
    if not analyzed:
        return {
            "thumbnail_url": "",
            "thumbnail_source": "none",
            "thumbnail_quality": build_empty_quality(reason="no-candidates"),
        }

    analyzed.sort(key=lambda item: (item["status"] == "pass", item["status"] == "warn", item["score"]), reverse=True)
    best = analyzed[0]
    keep_url = best["url"] if best["status"] in {"pass", "warn"} else ""
    keep_source = best["source"] if keep_url else "none"

    return {
        "thumbnail_url": keep_url,
        "thumbnail_source": keep_source,
        "thumbnail_quality": best,
    }
