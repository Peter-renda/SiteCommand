-- Commitments (subcontracts & purchase orders)
CREATE TABLE IF NOT EXISTS commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'subcontract', -- 'subcontract' | 'purchase_order'
  number INT NOT NULL,
  contract_company TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  erp_status TEXT NOT NULL DEFAULT 'not_synced', -- 'synced' | 'not_synced' | 'pending'
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'approved' | 'void' | 'terminated'
  executed BOOLEAN NOT NULL DEFAULT false,
  ssov_status TEXT NOT NULL DEFAULT '',
  original_contract_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  approved_change_orders NUMERIC(15,2) NOT NULL DEFAULT 0,
  pending_change_orders NUMERIC(15,2) NOT NULL DEFAULT 0,
  draft_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-number sequence per project handled in application layer
CREATE INDEX IF NOT EXISTS commitments_project_id_idx ON commitments(project_id);
CREATE INDEX IF NOT EXISTS commitments_deleted_at_idx ON commitments(deleted_at);
