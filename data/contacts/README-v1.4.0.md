# Contact enrichment v1.4.0

Sukuu Search loads verified operational contacts in release order:

1. `contact-enrichment.json` — established base records.
2. `contact-enrichment-v1.4.0.json` — append-only v1.4 institution-direct enrichment.

Contact enrichment never changes GTEC or CTVET accreditation source snapshots. Exact normalized aliases are required for assignment. Institution-direct contacts and central admissions/support contacts remain distinct scopes.

Tertiary accreditation status is a separate concern. Where an `accreditation_end_date` exists, the displayed status is date-driven: the record becomes expired after that date passes.
