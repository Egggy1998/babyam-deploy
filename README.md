# Baby A&M

Static website for [www.babyam.vn](https://www.babyam.vn), deployed by Vercel from the repository root.

## Structure

- `index.html`, `*.html`, `nuoi-day-tre/` — deployable static output.
- `content/nuoi-day-tre/` — Vietnamese parenting article source JSON.
- `scripts/build_parenting.py` — generates one parenting age section.
- `scripts/build_parenting_index.py` — rebuilds the parenting index.
- `scripts/apply_site_fixes.py` — normalizes metadata, canonical URLs, local assets, sitemap and robots.
- `scripts/audit_site.py` — production-readiness regression audit.

## Rebuild

```text
python scripts/build_parenting.py newborns
python scripts/build_parenting.py babies
python scripts/build_parenting.py toddlers
python scripts/build_parenting_index.py
python scripts/apply_site_fixes.py
python scripts/audit_site.py
```

The final audit must print `PASS` before deployment.

## Content note

Parenting and pregnancy articles are translated and edited from Raising Children Network and are for reference only. Medical product information should be reviewed by a qualified professional before publication.
