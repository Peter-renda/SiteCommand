-- Extended commitment fields to align with Purchase Orders and Subcontracts workflows

-- Subcontract-specific date fields
ALTER TABLE commitments
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS estimated_completion DATE,
  ADD COLUMN IF NOT EXISTS actual_completion DATE,
  ADD COLUMN IF NOT EXISTS signed_contract_received DATE;

-- Subcontract scope of work fields
ALTER TABLE commitments
  ADD COLUMN IF NOT EXISTS inclusions TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS exclusions TEXT NOT NULL DEFAULT '';

-- Purchase order-specific date fields
ALTER TABLE commitments
  ADD COLUMN IF NOT EXISTS contract_date DATE,
  ADD COLUMN IF NOT EXISTS issued_on_date DATE;

-- DocuSign integration toggle
ALTER TABLE commitments
  ADD COLUMN IF NOT EXISTS sign_docusign BOOLEAN NOT NULL DEFAULT false;

-- Financial markup enabled flag (per-commitment prerequisite)
ALTER TABLE commitments
  ADD COLUMN IF NOT EXISTS financial_markup_enabled BOOLEAN NOT NULL DEFAULT false;

-- Financial markup settings table (stored on the commitment-level settings)
ALTER TABLE commitment_settings
  ADD COLUMN IF NOT EXISTS enable_financial_markup BOOLEAN NOT NULL DEFAULT false;

-- Financial markup rules on commitment change orders
CREATE TABLE IF NOT EXISTS commitment_co_markups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  commitment_id UUID NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  change_order_id UUID REFERENCES change_orders(id) ON DELETE CASCADE,
  -- horizontal: displayed in same row as line items; vertical: displayed below
  markup_type TEXT NOT NULL DEFAULT 'horizontal',
  markup_name TEXT NOT NULL DEFAULT '',
  markup_percentage NUMERIC(8,4) NOT NULL DEFAULT 0,
  -- basic | compounds_all | selective | iterative_margin
  calculation_type TEXT NOT NULL DEFAULT 'basic',
  -- all | specific
  apply_to TEXT NOT NULL DEFAULT 'all',
  -- For specific application: segment (cost_code | type), condition (includes | excludes), values
  apply_segment TEXT NOT NULL DEFAULT '',
  apply_condition TEXT NOT NULL DEFAULT '',
  apply_values TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS commitment_co_markups_commitment_id_idx ON commitment_co_markups(commitment_id);
CREATE INDEX IF NOT EXISTS commitment_co_markups_change_order_id_idx ON commitment_co_markups(change_order_id);
CREATE INDEX IF NOT EXISTS commitment_co_markups_project_id_idx ON commitment_co_markups(project_id);
