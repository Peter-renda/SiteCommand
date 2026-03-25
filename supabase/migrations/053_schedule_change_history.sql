-- Add change_history column to project_schedules to persist inline date-edit history.
-- Stored as a JSONB array of ChangeEntry objects, newest first.
ALTER TABLE project_schedules
  ADD COLUMN IF NOT EXISTS change_history JSONB NOT NULL DEFAULT '[]';
