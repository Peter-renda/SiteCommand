ALTER TABLE rfis
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_rfis_project_is_deleted_rfi_number
  ON rfis(project_id, is_deleted, rfi_number);
