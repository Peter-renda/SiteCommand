-- Store the contact's own company name on external invitations so the
-- invite page can display it (e.g. "Smith & Jennings") instead of the
-- inviting company (e.g. "Hamel").
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS contact_company TEXT;
