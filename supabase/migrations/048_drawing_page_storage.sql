-- Each extracted drawing page now gets its own PDF file in storage.
-- This column holds the per-page storage path; NULL means the row still
-- references the parent upload's shared PDF (legacy / backward-compat).
ALTER TABLE project_drawings ADD COLUMN IF NOT EXISTS storage_path TEXT;
