-- Commitments (subcontracts & purchase orders)
CREATE TABLE IF NOT EXISTS commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'subcontract', -- 'subcontract' | 'purchase_order'
  number INT NOT NULL,
  -- General Information
  contract_company TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  erp_status TEXT NOT NULL DEFAULT 'not_synced', -- 'synced' | 'not_synced' | 'pending'
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'approved' | 'void' | 'terminated'
  executed BOOLEAN NOT NULL DEFAULT false,
  default_retainage NUMERIC(5,2) NOT NULL DEFAULT 10,
  assigned_to TEXT NOT NULL DEFAULT '',
  bill_to TEXT NOT NULL DEFAULT '',
  payment_terms TEXT NOT NULL DEFAULT '',
  ship_to TEXT NOT NULL DEFAULT '',
  ship_via TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  -- Contract Dates
  delivery_date DATE,
  signed_po_received_date DATE,
  -- Contract Privacy
  is_private BOOLEAN NOT NULL DEFAULT true,
  sov_view_allowed BOOLEAN NOT NULL DEFAULT false,
  -- Financial amounts
  ssov_status TEXT NOT NULL DEFAULT '',
  original_contract_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  approved_change_orders NUMERIC(15,2) NOT NULL DEFAULT 0,
  pending_change_orders NUMERIC(15,2) NOT NULL DEFAULT 0,
  draft_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  -- Subcontract additional fields
  subcontract_cover_letter TEXT NOT NULL DEFAULT '',
  bond_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  exhibit_a_scope TEXT NOT NULL DEFAULT '',
  trades TEXT NOT NULL DEFAULT '',
  subcontractor_contact TEXT NOT NULL DEFAULT '',
  -- Purchase order additional fields
  subcontract_type TEXT NOT NULL DEFAULT '',
  show_cover_letter BOOLEAN NOT NULL DEFAULT false,
  show_executed_cover_letter BOOLEAN NOT NULL DEFAULT false,
  -- SOV
  sov_accounting_method TEXT NOT NULL DEFAULT 'unit_quantity', -- 'unit_quantity' | 'amount'
  sort_order INT NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS commitments_project_id_idx ON commitments(project_id);
CREATE INDEX IF NOT EXISTS commitments_deleted_at_idx ON commitments(deleted_at);
