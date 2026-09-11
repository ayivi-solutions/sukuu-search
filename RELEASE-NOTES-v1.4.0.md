# Sukuu Search v1.4.0 — Verified Contact Enrichment

Released: 2026-09-11

## Scope

- Adds 10 institution-direct verified contact records through an append-only enrichment supplement.
- GTEC institution-direct coverage increases from 39 to 48 of 316 institutions.
- CTVET provider-direct coverage increases from 48 to 49 of 317 providers.
- Existing 132 GTEC central admissions/support records remain separately classified and are not counted as institution-direct.
- Tertiary accreditation status is derived from the recorded accreditation end date where present: after the end date passes, Sukuu Search displays the record as expired.
- Sukuu Search does not independently adjudicate regulatory standing; raw GTEC and CTVET source snapshots are unchanged.
- The protected school, region and district estate is unchanged.

## Contact quality controls

This batch uses institution-owned official sources only. Matching remains exact after normalization, fuzzy assignment is prohibited, unverifiable values are withheld, and WhatsApp is shown only where explicitly published by the institution.

## Runtime architecture

The v1.4 supplement is loaded after the existing contact dataset through `/assets/data-layer-v1.4.0.js`. This makes contact enrichment append-only and independently versionable without rewriting regulatory datasets or the existing school estate.
