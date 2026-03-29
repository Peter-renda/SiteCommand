-- ============================================================
-- Project ERP / Sage Intacct fields
-- Adds the columns needed to track whether a project has been
-- synced to Sage as a Job, and to store the Sage-assigned key.
-- ============================================================

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS erp_status  TEXT DEFAULT 'not_synced',
  ADD COLUMN IF NOT EXISTS sage_job_key TEXT;

NOTIFY pgrst, 'reload schema';
