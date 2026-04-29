CREATE TABLE IF NOT EXISTS prime_contract_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prime_contract_id UUID NOT NULL REFERENCES prime_contracts(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_by_name TEXT NOT NULL,
  action TEXT NOT NULL,
  field_name TEXT,
  from_value TEXT,
  to_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prime_contract_change_history_contract_id
  ON prime_contract_change_history(prime_contract_id);

CREATE INDEX IF NOT EXISTS idx_prime_contract_change_history_created_at
  ON prime_contract_change_history(created_at DESC);
