#!/usr/bin/env python
"""Apply deterministic metadata and asset fixes to the static Baby A&M output."""
from __future__ import annotations

import html
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "https://www.babyam.vn"
SKIP_HTML = {"googlea68c37251d2d3085.html"}

REMOTE_ASSETS = {
    "future-organic-stage-1.jpg": "future-stage-1.png",
    "future-organic-stage-2.jpg": "future-stage-2.png",
    "future-organic-stage-3.jpg": "future-stage-3.png",
    "https://i.ibb.co/ynxmDWRR/4d76e500-410a-4ffb-b379-38264d8c6908.png": "brand-logo.png",
    "https://i.ibb.co/h113dMnJ/Chat-GPT-Image-Apr-18-2026-11-51-50-PM.png": "hero-banner.jpg",
    "https://futureformula.com.au/wp-content/uploads/2025/05/66b701cc59cd0e1362fc82937c113646aa9ec8f6.png": "future-stage-1.png",
    "https://futureformula.com.au/wp-content/uploads/2025/05/a1ed194eadab7bcbbfd795002dcd281859998263.png": "future-stage-2.png",
    "https://futureformula.com.au/wp-content/uploads/2025/05/8d2e6dc8a6cd864cc11a7189911ceeb0454a77f2.png": "future-stage-3.png",
    "https://futureformula.com.au/wp-content/uploads/2025/05/1bd5bd5078a84775cc5a7f07162053a7a6df618a.png": "future-stage-1.png",
    "https://futureformula.com.au/wp-content/uploads/2025/05/f1a0ee2749b8a201935f9c3f0869965855dee12e.png": "future-stage-2.png",
    "https://futureformula.com.au/wp-content/uploads/2025/05/7eaf059e7c5102fb70aecea1f87ec685f0c56ba2.png": "future-stage-3.png",
    "https://i.ibb.co/qFrRX99w/20260421-135204.jpg": "infatrini.png",
    "https://i.ibb.co/s9ZK3CKg/Gemini-Generated-Image-5w2dhz5w2dhz5w2d.png": "news-usda.png",
    "https://i.ibb.co/w2rg5DK/Gemini-Generated-Image-npxnb2npxnb2npxn.png": "aptamil-1.png",
    "https://i.ibb.co/6z6Vk0y/Gemini-Generated-Image-8i32sa8i32sa8i32.png": "infatrini.png",
    "https://rh-canvas-files.xiaoyaoyou.com/4536087da9d97735da3cc20434228398/output/28b3cc4f-fda9-4d56-b147-0983782ea5a1.jpg": "aptamil-1.png",
    "https://rh-canvas-files.xiaoyaoyou.com/4536087da9d97735da3cc20434228398/output/59c84121-4b69-4172-92d8-c26386707c49.jpg": "news-usda.png",
    "https://rh-canvas-files.xiaoyaoyou.com/4536087da9d97735da3cc20434228398/output/45d0eb6e-8b33-4e5f-afc4-92ac532d0165.jpg": "infatrini.png",
}

DESCRIPTIONS = {
    "index.html": "Baby A&M phân phối sản phẩm dinh dưỡng chính hãng cho mẹ và bé, đồng thời cung cấp cẩm nang thai kỳ và nuôi dạy trẻ bằng tiếng Việt.",
    "news-aptamil-synbiotics.html": "Tìm hiểu hệ Synbiotics trong Aptamil Profutura và vai trò của probiotics, prebiotics, DHA và ARA đối với dinh dưỡng trẻ nhỏ.",
    "news-horizon-usda.html": "Tìm hiểu chứng nhận USDA Organic và các tiêu chuẩn áp dụng cho dòng sản phẩm Horizon Organic.",
    "news-infatrini-premature.html": "Thông tin tham khảo về Infatrini, sản phẩm dinh dưỡng y học cao năng lượng cho trẻ cần hỗ trợ tăng trưởng.",
}


def canonical_for(rel: str) -> str:
    return f"{BASE_URL}/" if rel == "index.html" else f"{BASE_URL}/{rel}"


def ensure_head_metadata(text: str, rel: str) -> str:
    description = DESCRIPTIONS.get(rel)
    if not re.search(r'<meta\s+[^>]*name=["\']description["\']', text, re.I):
        if not description:
            h1 = re.search(r"<h1[^>]*>(.*?)</h1>", text, re.I | re.S)
            plain = re.sub(r"<[^>]+>", "", h1.group(1)).strip() if h1 else "Baby A&M"
            description = f"{plain} — nội dung tham khảo dành cho gia đình Việt từ Baby A&M."
        title_end = re.search(r"</title>", text, re.I)
        if title_end:
            text = text[: title_end.end()] + f'\n<meta name="description" content="{html.escape(description, quote=True)}">' + text[title_end.end() :]

    canonical = canonical_for(rel)
    if re.search(r'<link\s+[^>]*rel=["\']canonical["\']', text, re.I):
        text = re.sub(
            r'<link\s+[^>]*rel=["\']canonical["\'][^>]*>',
            f'<link rel="canonical" href="{canonical}">',
            text,
            count=1,
            flags=re.I,
        )
    else:
        viewport = re.search(r'<meta\s+[^>]*name=["\']viewport["\'][^>]*>', text, re.I)
        if viewport:
            text = text[: viewport.end()] + f'\n<link rel="canonical" href="{canonical}">' + text[viewport.end() :]
        else:
            text = text.replace("</head>", f'<link rel="canonical" href="{canonical}">\n</head>', 1)
    return text


def fix_index(text: str) -> str:
    # Remove mixed UTF-16 comments accidentally appended after the document.
    end = text.lower().rfind("</html>")
    if end >= 0:
        text = text[: end + len("</html>")] + "\n"

    for remote, local in REMOTE_ASSETS.items():
        text = text.replace(remote, local)

    text = text.replace('<h2 class="section-title reveal reveal-delay-1">CÔNG TY TNHH BABY A&amp;M</h2>', '<h1 class="section-title reveal reveal-delay-1">CÔNG TY TNHH BABY A&amp;M</h1>')
    text = text.replace('<div class="exp-badge"><div class="num">10+</div><div class="label">Năm kinh nghiệm</div></div>', '<div class="exp-badge"><div class="num">A&amp;M</div><div class="label">Đồng hành Mẹ &amp; Bé</div></div>')
    text = text.replace("Giá sỉ tốt nhất thị trường", "Chính sách giá sỉ cạnh tranh")
    text = text.replace("Giá sỉ tốt nhất — Chính hãng", "Giá sỉ cạnh tranh — Chính hãng")
    text = text.replace("tel:+849" + "****" + "9539", "tel:+84" + "967" + "339" + "539")
    text = text.replace("Bổsung", "Bổ sung")
    text = text.replace("dinh dưỡng madre", "dinh dưỡng cho trẻ nhỏ")
    text = text.replace("© 2025 Baby A&M", f"© {date.today().year} Baby A&M")
    text = text.replace("&copy; 2025 Baby A&M", f"&copy; {date.today().year} Baby A&M")
    text = text.replace("Không GMO; Canxi & Vitamin D", "USDA Organic; Canxi & Vitamin D")
    text = text.replace("Không GMO; Canxi & Vitamin D3", "USDA Organic; Canxi & Vitamin D3")
    text = text.replace("Quy trình chăn nuôi cam kết không hormone tăng trưởng, không kháng sinh, không GMO", "Quy trình sản xuất tuân theo tiêu chuẩn USDA Organic")
    text = text.replace("Không chứa gluten, không GMO, không cholesterol", "Công thức dinh dưỡng chuyên biệt; sử dụng theo tư vấn chuyên môn")
    text = text.replace('<span class="product-tag">Không GMO</span>', '<span class="product-tag">USDA Organic</span>')
    text = text.replace("báo giá sỉ tốt nhất", "báo giá sỉ cạnh tranh")
    text = re.sub(r'<script\s+data-cfasync="false"\s+src="/cdn-cgi/scripts/[^>]+></script>', "", text, flags=re.I)

    # Make product cards keyboard accessible without changing their visual design.
    text = re.sub(r'<div class="(future-card[^"]*)" onclick="openModal\(([^)]+)\)">', r'<div class="\1" role="button" tabindex="0" onclick="openModal(\2)" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();openModal(\2)}">', text)
    text = re.sub(r'<div class="(product-card[^"]*)" onclick="openModal\(([^)]+)\)">', r'<div class="\1" role="button" tabindex="0" onclick="openModal(\2)" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();openModal(\2)}">', text)
    return text


def build_sitemap(html_files: list[Path]) -> None:
    urls = []
    for path in html_files:
        rel = path.relative_to(ROOT).as_posix()
        urls.append(canonical_for(rel))
    body = "\n".join(f"  <url><loc>{html.escape(url)}</loc></url>" for url in sorted(urls))
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{body}\n</urlset>\n",
        encoding="utf-8",
    )
    (ROOT / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\n\nSitemap: {BASE_URL}/sitemap.xml\n",
        encoding="utf-8",
    )


def main() -> None:
    html_files = sorted(
        p for p in ROOT.rglob("*.html")
        if ".git" not in p.parts
        and "taste-skill-main" not in p.parts
        and not p.name.endswith(".tmp")
        and p.name not in SKIP_HTML
    )
    for path in html_files:
        rel = path.relative_to(ROOT).as_posix()
        raw = path.read_bytes()
        text = raw.decode("utf-8", errors="ignore")
        if rel == "index.html":
            text = fix_index(text)
        for remote, local in REMOTE_ASSETS.items():
            text = text.replace(remote, local if path.parent == ROOT else f"/{local}")
        text = ensure_head_metadata(text, rel)
        path.write_text(text, encoding="utf-8", newline="\n")

    product_csv = ROOT / "san-pham.csv"
    if product_csv.is_file():
        csv_text = product_csv.read_text(encoding="utf-8")
        for remote, local in REMOTE_ASSETS.items():
            csv_text = csv_text.replace(remote, local)
        csv_text = csv_text.replace("Không GMO;", "USDA Organic;")
        product_csv.write_text(csv_text, encoding="utf-8", newline="\n")

    build_sitemap(html_files)
    print(f"Updated {len(html_files)} HTML pages")


if __name__ == "__main__":
    main()
