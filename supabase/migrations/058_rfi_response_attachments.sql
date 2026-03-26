ALTER TABLE rfi_responses ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]';
