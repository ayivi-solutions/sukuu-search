# Sukuu Search — National Metadata Foundation v1.1.1

**Target:** https://search.sukuux.com/
**Baseline:** Ghana_Schools_Search_SukuuX_SEO_Deployment_2026-09-03.zip
**Build date:** 2026-09-10

This release extends the already-deployed Ghana Schools Search without changing existing school, region or district canonical URLs.

## What v1.1.1 establishes

- `/metadata/` — public, searchable national dataset catalogue.
- `/metadata/sources/` — authority/source register and ingestion policy.
- `/metadata/model/` — entity, geography, provenance and temporal-truth model.
- `/data/registry/` — machine-readable dataset/source registries, field dictionary and JSON Schemas.
- `/data/geography/ghana-admin-index.json` — canonical 16-region / 261-district join index generated from the deployed boundary data.
- `/.well-known/sukuu-search.json` — machine discovery entry point.
- `sitemap-metadata.xml` — crawl discovery for the new metadata surfaces.
- A small non-destructive entry point from the existing school explorer and top-level SEO discovery pages to the national metadata catalogue.

## Status semantics

- **Live** — records are locally materialized and already used by the deployed experience.
- **Ingestion ready** — the authority, schema, provenance policy and target entity type are defined; upstream records are not yet represented as fully ingested.
- **Planned** — source/use case is registered but controlled ingestion has not started.

No page is allowed to imply that an ingestion-ready or planned dataset is already a complete local register.

## Next controlled ingestion sequence

1. GTEC tertiary institutions + accredited programmes.
2. CTVET providers + programmes + qualification levels.
3. NaCCA approved learning resources.
4. Ghana Scholarships Authority opportunities.
5. Ghana Library Authority branches.

Each ingestion should create a dated source snapshot, normalize records into the common entity model, retain authority-issued IDs, create source fingerprints, validate geography, generate static crawlable pages and add a dedicated sitemap segment.


## v1.1.1 geography correction

Guan District uses canonical Sukuu ADM2 code `GH1009`, assigned as the next sequential Oti Region district code after `GH1008`. The geometry remains sourced from OpenStreetMap relation `13804589`, retained separately as provenance (`osm:relation:13804589`). This follows the same sequential extension convention already used for post-baseline constituency metadata.
