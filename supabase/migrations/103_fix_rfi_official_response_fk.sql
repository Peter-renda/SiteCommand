ALTER TABLE rfis
  DROP CONSTRAINT IF EXISTS rfis_official_response_id_fkey;

ALTER TABLE rfis
  ADD CONSTRAINT rfis_official_response_id_fkey
  FOREIGN KEY (official_response_id)
  REFERENCES rfi_responses(id)
  ON DELETE SET NULL;
