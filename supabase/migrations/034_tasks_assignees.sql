-- Add assignees JSONB column to tasks (same shape as distribution_list)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS assignees JSONB NOT NULL DEFAULT '[]';
