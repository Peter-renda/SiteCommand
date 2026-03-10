-- Add job_title and address fields to directory_contacts

ALTER TABLE directory_contacts
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS address   TEXT;
