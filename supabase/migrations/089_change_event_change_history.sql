CREATE TABLE IF NOT EXISTS change_event_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_event_id UUID NOT NULL REFERENCES change_events(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_by_name TEXT,
  changed_by_company TEXT,
  action TEXT NOT NULL,
  from_value TEXT,
  to_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_change_event_change_history_event_id
  ON change_event_change_history(change_event_id);

CREATE INDEX IF NOT EXISTS idx_change_event_change_history_created_at
  ON change_event_change_history(created_at DESC);
