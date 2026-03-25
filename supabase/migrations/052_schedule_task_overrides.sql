-- Add task_overrides column to project_schedules to persist inline date edits.
-- Stored as JSONB: { "<uid>": { "start": "YYYY-MM-DD", "finish": "YYYY-MM-DD" }, ... }
ALTER TABLE project_schedules
  ADD COLUMN IF NOT EXISTS task_overrides JSONB NOT NULL DEFAULT '{}';
