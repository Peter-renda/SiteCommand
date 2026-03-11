-- Prime Contracts
CREATE TABLE IF NOT EXISTS prime_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  contract_number INT NOT NULL,
  owner_client_id TEXT,
  title TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  executed BOOLEAN NOT NULL DEFAULT FALSE,
  default_retainage NUMERIC(5,2),
  contractor_id TEXT,
  architect_engineer_id TEXT,
  description TEXT,
  inclusions TEXT,
  exclusions TEXT,
  start_date DATE,
  estimated_completion_date DATE,
  actual_completion_date DATE,
  signed_contract_received_date DATE,
  contract_termination_date DATE,
  is_private BOOLEAN NOT NULL DEFAULT TRUE,
  non_admin_access JSONB NOT NULL DEFAULT '[]',
  allow_non_admin_sov_view BOOLEAN NOT NULL DEFAULT FALSE,
  accounting_method TEXT NOT NULL DEFAULT 'amount',
  attachments JSONB NOT NULL DEFAULT '[]',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schedule of Values line items
CREATE TABLE IF NOT EXISTS prime_contract_sov_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES prime_contracts(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_number INT NOT NULL,
  group_name TEXT,
  budget_code TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  billed_to_date NUMERIC(15,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
