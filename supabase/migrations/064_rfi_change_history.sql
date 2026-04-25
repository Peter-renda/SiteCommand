CREATE TABLE IF NOT EXISTS rfi_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfi_id UUID NOT NULL REFERENCES rfis(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id),
  changed_by_name TEXT,
  changed_by_company TEXT,
  action TEXT NOT NULL,
  from_value TEXT,
  to_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rfi_change_history_rfi_id ON rfi_change_history(rfi_id);
CREATE INDEX IF NOT EXISTS idx_rfi_change_history_created_at ON rfi_change_history(created_at DESC);
