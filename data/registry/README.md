# Sukuu Search registry contract

This directory is the machine-readable control plane for national metadata expansion. `dataset-registry.json` says what datasets exist and their implementation status; `source-registry.json` says which authority/source backs each dataset and how ingestion must be treated. JSON Schemas describe normalized records.

A source registry entry is not a licence grant. `reuse_status: review_required` means the ingestion implementation must confirm legal/technical reuse conditions before storing or redistributing upstream content.

## Verification states

- `official_source_observed` — fact seen on the named official public surface; no durable source snapshot necessarily retained.
- `official_snapshot` — dated upstream snapshot retained with source identity/fingerprint.
- `institution_supplied` — supplied directly by the represented institution.
- `sukuu_verified` — independently checked under a documented Sukuu verification workflow.
- `derived` — computed from other sourced data.
- `unverified` — present but not yet verified.

Never translate one state into another merely because a record appears plausible.
