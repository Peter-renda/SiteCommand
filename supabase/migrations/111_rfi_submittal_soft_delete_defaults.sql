-- Ensure legacy rows without explicit soft-delete values still appear in active lists.
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN;
ALTER TABLE submittals ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN;

UPDATE rfis SET is_deleted = false WHERE is_deleted IS NULL;
UPDATE submittals SET is_deleted = false WHERE is_deleted IS NULL;

ALTER TABLE rfis ALTER COLUMN is_deleted SET DEFAULT false;
ALTER TABLE submittals ALTER COLUMN is_deleted SET DEFAULT false;

ALTER TABLE rfis ALTER COLUMN is_deleted SET NOT NULL;
ALTER TABLE submittals ALTER COLUMN is_deleted SET NOT NULL;
