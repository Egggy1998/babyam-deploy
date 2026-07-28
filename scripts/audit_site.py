#!/usr/bin/env python
"""Deterministic production-readiness audit for the static Baby A&M site."""
from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "https://www.babyam.vn"
SKIP_HTML = {"googlea68c37251d2d3085.html"}


def fail(message: str, failures: list[str]) -> None:
    failures.append(message)


def main() -> int:
    failures: list[str] = []
    html_files = sorted(
        p for p in ROOT.rglob("*.html")
        if ".git" not in p.parts
        and "taste-skill-main" not in p.parts
        and not p.name.endswith(".tmp")
        and p.name not in SKIP_HTML
    )
    public_files = {
        p.relative_to(ROOT).as_posix()
        for p in ROOT.rglob("*")
        if p.is_file() and ".git" not in p.parts and "taste-skill-main" not in p.parts
    }

    for path in html_files:
        rel = path.relative_to(ROOT).as_posix()
        raw = path.read_bytes()
        if b"\x00" in raw:
            fail(f"{rel}: contains NUL bytes", failures)
        text = raw.decode("utf-8", errors="replace")
        if "\ufffd" in text:
            fail(f"{rel}: contains Unicode replacement characters", failures)
        if not re.match(r"\s*<!doctype html>", text, re.I):
            fail(f"{rel}: missing doctype", failures)
        if len(re.findall(r"<h1\b", text, re.I)) != 1:
            fail(f"{rel}: must contain exactly one h1", failures)
        if not re.search(r'<meta\s+[^>]*name=["\']description["\'][^>]*>', text, re.I):
            fail(f"{rel}: missing meta description", failures)
        expected = f"{BASE_URL}/{rel}" if rel != "index.html" else f"{BASE_URL}/"
        canonical_match = re.search(r'<link\s+[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']+)', text, re.I)
        if not canonical_match:
            fail(f"{rel}: missing canonical", failures)
        elif canonical_match.group(1) != expected:
            fail(f"{rel}: canonical is {canonical_match.group(1)!r}, expected {expected!r}", failures)

        for src in re.findall(r'<img\b[^>]*\bsrc=["\']([^"\']+)', text, re.I):
            if src.startswith(("http://", "https://", "//")):
                fail(f"{rel}: remote image dependency {src}", failures)

        for ref in re.findall(r'(?:href|src)=["\']([^"\']+)["\']', text, re.I):
            if ref.startswith(("#", "mailto:", "tel:", "javascript:", "data:", "http://", "https://", "//")):
                continue
            clean = unquote(urlsplit(ref).path)
            if not clean:
                continue
            target = clean.lstrip("/") if clean.startswith("/") else (path.parent / clean).resolve().relative_to(ROOT.resolve()).as_posix()
            if target.endswith("/"):
                target += "index.html"
            if target not in public_files:
                fail(f"{rel}: broken local reference {ref} -> {target}", failures)

    index = (ROOT / "index.html").read_text(encoding="utf-8")
    forbidden = {
        "futureformula.com.au/wp-content/uploads": "dead Future Formula hotlinks",
        "/cdn-cgi/scripts/": "Cloudflare-only email decoder",
        "Bổsung": "typo Bổsung",
        "madre": "typo madre",
        "© 2025": "stale copyright year",
        "tel:+849" + "****" + "9539": "masked telephone URI",
        "Không GMO": "unsupported non-GMO claim",
        "báo giá sỉ tốt nhất": "unsupported best-price claim",
        "future-organic-stage-": "broken Organic crop asset",
    }
    for needle, label in forbidden.items():
        if needle in index:
            fail(f"index.html: contains {label}", failures)

    robots = ROOT / "robots.txt"
    sitemap = ROOT / "sitemap.xml"
    if not robots.is_file():
        fail("robots.txt: missing", failures)
    elif f"Sitemap: {BASE_URL}/sitemap.xml" not in robots.read_text(encoding="utf-8"):
        fail("robots.txt: missing canonical sitemap URL", failures)
    if not sitemap.is_file():
        fail("sitemap.xml: missing", failures)
    else:
        sitemap_text = sitemap.read_text(encoding="utf-8")
        for path in html_files:
            rel = path.relative_to(ROOT).as_posix()
            url = f"{BASE_URL}/" if rel == "index.html" else f"{BASE_URL}/{rel}"
            if f"<loc>{url}</loc>" not in sitemap_text:
                fail(f"sitemap.xml: missing {url}", failures)

    if failures:
        print(f"FAIL: {len(failures)} issue(s)")
        for item in failures[:100]:
            print(f"- {item}")
        if len(failures) > 100:
            print(f"- ... {len(failures) - 100} more")
        return 1

    print(f"PASS: audited {len(html_files)} HTML pages")
    return 0


if __name__ == "__main__":
    sys.exit(main())
