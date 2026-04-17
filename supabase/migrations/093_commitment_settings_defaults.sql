-- Add project-level default settings for commitments tool configuration.
-- enable_ssov_by_default: when true, new commitments are created with SSOV enabled.
-- enable_financial_markup: project-level prerequisite for per-commitment financial markup.

ALTER TABLE commitment_settings
  ADD COLUMN IF NOT EXISTS enable_ssov_by_default BOOLEAN NOT NULL DEFAULT false;
