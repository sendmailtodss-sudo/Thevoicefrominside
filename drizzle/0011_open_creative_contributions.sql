-- Art and music contributions are open to every authenticated account.
-- Remove the obsolete imprisonment/family-connection attestation instead of
-- collecting or manufacturing one for new artists. Preserve IDs and references.
ALTER TABLE creative_artists DROP COLUMN eligibility_attested_at;
