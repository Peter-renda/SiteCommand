-- Ensure contact_company column exists on invitations.
-- This is a safety re-run of 054 for environments where that migration
-- was not applied before the invite-external route started writing the column.
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS contact_company TEXT;
