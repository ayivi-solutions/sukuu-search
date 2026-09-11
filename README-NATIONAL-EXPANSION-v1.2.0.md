# Sukuu Search — National Expansion v1.2.0

**Observation/build date:** 2026-09-11
**Scope:** Ghana-wide multi-sector metadata/discovery infrastructure; schools are the first production vertical, not the platform boundary.

## Materialized in this release

- 10,503 existing canonical school profiles indexed into unified national search without modifying their profile pages.
- 316 GTEC category listing rows resolving to 316 unique GTEC institutionId records.
- 3,614 GTEC programme accreditation rows.
- 317 numbered CTVET provider records (serials 1–317).
- 1,601 CTVET programme/accreditation occurrence rows preserving continuation-row inheritance evidence.
- 87 CTVET CBT-approved programme taxonomy rows.

## Source controls

GTEC category total at observation: 316; GTEC homepage accredited-institution headline: 318. These are retained as separate source observations rather than forced to agree.

CTVET numbered register continuity is 1–317 with no missing or duplicate serials. Provider current state is derived from dated occurrences; 317 is not represented as an active-provider count.

Raw official HTML snapshots are retained in the local evidence archive. The public repository stores normalized factual metadata, provenance, source URLs and fingerprints while reuse status remains review_required.

## Regression boundary

No existing singular school/, region/ or district/ profile page is written by this release. Guan District remains canonical ADM2 GH1009.
