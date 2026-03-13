-- Prime contracts
CREATE TABLE IF NOT EXISTS prime_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT,
  owner_client TEXT,
  title TEXT,
  erp_status TEXT NOT NULL DEFAULT 'Not Ready',
  status TEXT NOT NULL DEFAULT 'Draft',
  executed BOOLEAN NOT NULL DEFAULT false,
  original_contract_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  approved_change_orders NUMERIC(15,2) NOT NULL DEFAULT 0,
  pending_change_orders NUMERIC(15,2) NOT NULL DEFAULT 0,
  draft_change_orders NUMERIC(15,2) NOT NULL DEFAULT 0,
  invoiced NUMERIC(15,2) NOT NULL DEFAULT 0,
  payments_received NUMERIC(15,2) NOT NULL DEFAULT 0,
  default_retainage NUMERIC(5,2),
  contractor TEXT,
  architect_engineer TEXT,
  description TEXT,
  inclusions TEXT,
  exclusions TEXT,
  start_date DATE,
  estimated_completion_date DATE,
  actual_completion_date DATE,
  signed_contract_received_date DATE,
  contract_termination_date DATE,
  is_private BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prime contract schedule of values items
CREATE TABLE IF NOT EXISTS prime_contract_sov_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES prime_contracts(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  budget_code TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  billed_to_date NUMERIC(15,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
