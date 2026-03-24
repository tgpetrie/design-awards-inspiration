#!/usr/bin/env python3
"""
Query the local design-awards inspiration catalog.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from dataset_catalog import load_awwwards_catalog

QUERY_ALIASES = {
    "app-ui": {"mobile", "apps", "ui", "design"},
    "agency": {"design", "agencies"},
    "brutalist": {"graphic", "experimental", "typography", "unusual", "layout"},
    "checkout": {"e-commerce", "consumer", "ui", "design", "clean"},
    "dashboard": {"technology", "startups", "ui", "design", "data", "visualization"},
    "editorial": {"typography", "graphic", "magazine", "blog", "newspaper"},
    "fintech": {"technology", "startups", "business", "corporate", "clean"},
    "immersive": {"animation", "storytelling", "3d", "interaction", "scrolling", "webgl"},
    "landing-page": {"promotional", "storytelling", "scrolling", "typography"},
    "luxury": {"luxury"},
    "minimalist": {"minimal", "clean"},
    "motion": {"animation", "transitions", "microinteractions", "scrolling", "storytelling"},
    "onboarding": {"mobile", "apps", "clean", "ui", "design", "interaction"},
    "portfolio": {"portfolio"},
    "playful": {"colorful", "illustration", "animation", "graphic"},
    "saas": {"technology", "startups", "clean", "ui", "design"},
}


def split_multi(values: list[str] | None) -> list[str]:
    items: list[str] = []
    for value in values or []:
        for piece in value.split(","):
            piece = piece.strip()
            if piece:
                items.append(piece)
    return items


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def tokens(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9][a-z0-9.+/&'-]*", text.lower()))


def tokenized_values(values: list[str]) -> set[str]:
    combined: set[str] = set()
    for value in values:
        combined.update(tokens(value))
        combined.add(normalize(value))
    return combined

def list_values(entries: list[dict], key: str) -> list[str]:
    values = sorted({value for entry in entries for value in entry.get(key, [])})
    return values


def find_reference(entries: list[dict], needle: str) -> dict | None:
    target = normalize(needle)
    for entry in entries:
        if normalize(entry["title"]) == target or normalize(entry["slug"]) == target:
            return entry
    for entry in entries:
        if target in normalize(entry["title"]) or target in normalize(entry["slug"]):
            return entry
    return None


def similarity_score(base: dict, candidate: dict) -> float:
    base_terms = set(base["categories"]) | set(base["style_tags"]) | set(base["tech_tags"])
    cand_terms = set(candidate["categories"]) | set(candidate["style_tags"]) | set(candidate["tech_tags"])
    shared = base_terms & cand_terms
    union = base_terms | cand_terms
    score = len(shared) / len(union) if union else 0.0
    score += len(shared) * 0.05
    return score


def matches_filters(entry: dict, categories: list[str], styles: list[str], techs: list[str]) -> bool:
    entry_categories = {normalize(value) for value in entry.get("categories", [])}
    entry_styles = {normalize(value) for value in entry.get("style_tags", [])}
    entry_tech = {normalize(value) for value in entry.get("tech_tags", [])}

    if any(normalize(value) not in entry_categories for value in categories):
        return False
    if any(normalize(value) not in entry_styles for value in styles):
        return False
    if any(normalize(value) not in entry_tech for value in techs):
        return False
    return True


def query_score(entry: dict, query_terms: set[str]) -> tuple[float, list[str]]:
    haystacks = {
        "title": tokens(entry["title"]),
        "slug": tokens(entry["slug"]),
        "categories": tokenized_values(entry.get("categories", [])),
        "style_tags": tokenized_values(entry.get("style_tags", [])),
        "tech_tags": tokenized_values(entry.get("tech_tags", [])),
        "tags": tokenized_values(entry.get("tags", [])),
    }

    score = 0.0
    matched: list[str] = []
    for term in query_terms:
        if term in haystacks["title"]:
            score += 3.0
            matched.append(f"title:{term}")
        elif term in haystacks["slug"]:
            score += 2.5
            matched.append(f"slug:{term}")
        elif term in haystacks["categories"]:
            score += 2.2
            matched.append(f"category:{term}")
        elif term in haystacks["style_tags"]:
            score += 2.0
            matched.append(f"style:{term}")
        elif term in haystacks["tech_tags"]:
            score += 1.8
            matched.append(f"tech:{term}")
        elif term in haystacks["tags"]:
            score += 1.5
            matched.append(f"tag:{term}")

    return score, matched


def expand_query_terms(query_terms: set[str]) -> set[str]:
    expanded = set(query_terms)
    for term in list(query_terms):
        expanded.update(QUERY_ALIASES.get(term, set()))
    return expanded


def print_values(label: str, values: list[str]) -> None:
    print(label)
    for value in values:
        print(value)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("query", nargs="*")
    parser.add_argument("--dataset", type=Path)
    parser.add_argument("--category", action="append")
    parser.add_argument("--style", action="append")
    parser.add_argument("--tech", action="append")
    parser.add_argument("--similar-to")
    parser.add_argument("--limit", type=int, default=8)
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--list-categories", action="store_true")
    parser.add_argument("--list-styles", action="store_true")
    parser.add_argument("--list-tech", action="store_true")
    args = parser.parse_args()

    data = load_awwwards_catalog(args.dataset)
    entries = data["entries"]

    if args.list_categories:
        print_values("categories", list_values(entries, "categories"))
        return 0
    if args.list_styles:
        print_values("styles", list_values(entries, "style_tags"))
        return 0
    if args.list_tech:
        print_values("tech", list_values(entries, "tech_tags"))
        return 0

    categories = split_multi(args.category)
    styles = split_multi(args.style)
    techs = split_multi(args.tech)
    filtered = [
        entry
        for entry in entries
        if matches_filters(entry, categories, styles, techs)
    ]

    if args.similar_to:
        base = find_reference(filtered or entries, args.similar_to)
        if base is None:
            print(f'no reference found for "{args.similar_to}"', file=sys.stderr)
            return 1
        scored = []
        for entry in filtered or entries:
            if entry["slug"] == base["slug"]:
                continue
            scored.append(
                {
                    "score": similarity_score(base, entry),
                    "match_reason": f"similar to {base['title']}",
                    "entry": entry,
                }
            )
        scored.sort(key=lambda item: (-item["score"], item["entry"]["rank"]))
    else:
        query_terms = expand_query_terms(tokens(" ".join(args.query)))
        scored = []
        for entry in filtered:
            score, matched = query_score(entry, query_terms)
            if query_terms and score <= 0:
                continue
            scored.append(
                {
                    "score": score,
                    "match_reason": ", ".join(matched) if matched else "top-ranked seed reference",
                    "entry": entry,
                }
            )
        scored.sort(key=lambda item: (-item["score"], item["entry"]["rank"]))

    results = scored[: args.limit]
    if not results:
        print("no matches", file=sys.stderr)
        return 1

    if args.json:
        print(
            json.dumps(
                {
                    "dataset": data["dataset"],
                    "results": [
                        {
                            "score": round(item["score"], 3),
                            "match_reason": item["match_reason"],
                            **item["entry"],
                        }
                        for item in results
                    ],
                },
                indent=2,
            )
        )
        return 0

    print(data["dataset"])
    for item in results:
        entry = item["entry"]
        print(f"{entry['rank']}. {entry['title']} ({entry['award_date']})")
        print(f"   reason: {item['match_reason']}")
        print(f"   categories: {', '.join(entry['categories']) or '-'}")
        print(f"   style: {', '.join(entry['style_tags']) or '-'}")
        print(f"   tech: {', '.join(entry['tech_tags']) or '-'}")
        print(f"   live: {entry['live_url']}")
        print(f"   source: {entry['source_url']}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
