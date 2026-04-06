-- Add notes and agenda columns to meetings
ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS agenda jsonb NOT NULL DEFAULT '[]'::jsonb;
