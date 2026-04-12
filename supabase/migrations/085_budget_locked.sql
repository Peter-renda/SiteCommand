-- Persist budget lock state on the project so it survives page reloads.
-- Once budget_locked is set to true it is never set back to false.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS budget_locked BOOLEAN NOT NULL DEFAULT false;
