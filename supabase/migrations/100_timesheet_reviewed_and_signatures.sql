BEGIN;

ALTER TABLE timesheet_entries
  ADD COLUMN IF NOT EXISTS signature_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timesheets_status_check') THEN
    ALTER TABLE timesheets DROP CONSTRAINT timesheets_status_check;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timesheet_entries_status_check') THEN
    ALTER TABLE timesheet_entries DROP CONSTRAINT timesheet_entries_status_check;
  END IF;
END $$;

ALTER TABLE timesheets
  ADD CONSTRAINT timesheets_status_check
  CHECK (status IN ('draft', 'submitted', 'reviewed', 'approved', 'completed'));

ALTER TABLE timesheet_entries
  ADD CONSTRAINT timesheet_entries_status_check
  CHECK (status IN ('draft', 'submitted', 'reviewed', 'approved', 'completed'));

COMMIT;
