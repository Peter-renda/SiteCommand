ALTER TABLE project_drawings ADD COLUMN IF NOT EXISTS discipline TEXT;
ALTER TABLE project_drawings ADD COLUMN IF NOT EXISTS set_name TEXT;
ALTER TABLE project_drawings ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';
