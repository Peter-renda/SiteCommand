-- Add attachments column for meetings
ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;
