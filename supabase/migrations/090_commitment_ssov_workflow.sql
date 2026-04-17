-- Commitments: Subcontractor SOV workflow + commitment settings
--
-- Aligns the Commitments tool with Procore's Subcontractor SOV tutorial:
--   * SSOV tab enablement per commitment
--   * Enum-like SSOV status (draft, under_review, revise_resubmit, approved)
--   * SSOV detail line items
--   * Project-level commitment settings (Enable Always Editable SOV)

-- 1. Commitment-level SSOV fields -------------------------------------------

ALTER TABLE commitments
  ADD COLUMN IF NOT EXISTS ssov_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ssov_notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ssov_submitted_at TIMESTAMPTZ;

-- Normalize any legacy free-text values and then enforce the enum.
UPDATE commitments
   SET ssov_status = CASE
     WHEN LOWER(TRIM(ssov_status)) IN ('draft')            THEN 'draft'
     WHEN LOWER(TRIM(ssov_status)) IN ('under review', 'under_review', 'submitted') THEN 'under_review'
     WHEN LOWER(TRIM(ssov_status)) IN ('revise & resubmit', 'revise_resubmit', 'revise and resubmit') THEN 'revise_resubmit'
     WHEN LOWER(TRIM(ssov_status)) IN ('approved')         THEN 'approved'
     ELSE ''
   END;

ALTER TABLE commitments
  DROP CONSTRAINT IF EXISTS commitments_ssov_status_check;

ALTER TABLE commitments
  ADD CONSTRAINT commitments_ssov_status_check
    CHECK (ssov_status IN ('', 'draft', 'under_review', 'revise_resubmit', 'approved'));

-- 2. Subcontractor SOV detail line items ------------------------------------

CREATE TABLE IF NOT EXISTS commitment_ssov_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id UUID NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sov_item_id UUID REFERENCES commitment_sov_items(id) ON DELETE SET NULL,
  budget_code TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS commitment_ssov_items_commitment_id_idx
  ON commitment_ssov_items(commitment_id);
CREATE INDEX IF NOT EXISTS commitment_ssov_items_project_id_idx
  ON commitment_ssov_items(project_id);

-- 3. Project-level commitment settings --------------------------------------

CREATE TABLE IF NOT EXISTS commitment_settings (
  project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  enable_always_editable_sov BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_commitment_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_commitment_settings_updated_at ON commitment_settings;
CREATE TRIGGER trg_commitment_settings_updated_at
BEFORE UPDATE ON commitment_settings
FOR EACH ROW
EXECUTE FUNCTION set_commitment_settings_updated_at();

NOTIFY pgrst, 'reload schema';
