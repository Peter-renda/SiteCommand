CREATE TABLE IF NOT EXISTS commitment_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id UUID NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_by_name TEXT,
  action TEXT NOT NULL,
  field_name TEXT,
  from_value TEXT,
  to_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commitment_change_history_commitment_id
  ON commitment_change_history(commitment_id);

CREATE INDEX IF NOT EXISTS idx_commitment_change_history_created_at
  ON commitment_change_history(created_at DESC);
