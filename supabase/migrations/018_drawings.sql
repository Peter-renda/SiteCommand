CREATE TABLE IF NOT EXISTS drawing_uploads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  storage_path     TEXT NOT NULL,
  filename         TEXT NOT NULL,
  page_count       INT NOT NULL DEFAULT 0,
  uploaded_by_name TEXT NOT NULL,
  uploaded_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_drawings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  upload_id     UUID NOT NULL REFERENCES drawing_uploads(id) ON DELETE CASCADE,
  page_number   INT NOT NULL,
  drawing_no    TEXT,
  title         TEXT,
  revision      TEXT,
  drawing_date  DATE,
  received_date DATE,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
