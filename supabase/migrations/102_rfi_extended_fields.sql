ALTER TABLE rfis
  ADD COLUMN IF NOT EXISTS schedule_impact TEXT,
  ADD COLUMN IF NOT EXISTS cost_impact TEXT,
  ADD COLUMN IF NOT EXISTS cost_code TEXT,
  ADD COLUMN IF NOT EXISTS sub_job TEXT,
  ADD COLUMN IF NOT EXISTS rfi_stage TEXT,
  ADD COLUMN IF NOT EXISTS private BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_rfis_project_private_created_by
  ON rfis (project_id, private, created_by);
