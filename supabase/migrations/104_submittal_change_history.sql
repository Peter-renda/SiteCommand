CREATE TABLE IF NOT EXISTS submittal_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submittal_id UUID NOT NULL REFERENCES submittals(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_by_name TEXT,
  changed_by_company TEXT,
  action TEXT NOT NULL,
  from_value TEXT,
  to_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submittal_change_history_submittal_id
  ON submittal_change_history(submittal_id);

CREATE INDEX IF NOT EXISTS idx_submittal_change_history_created_at
  ON submittal_change_history(created_at DESC);
