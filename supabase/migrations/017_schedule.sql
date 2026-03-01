CREATE TABLE IF NOT EXISTS project_schedules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  storage_path     TEXT NOT NULL,
  filename         TEXT NOT NULL,
  uploaded_by_name TEXT NOT NULL,
  uploaded_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
