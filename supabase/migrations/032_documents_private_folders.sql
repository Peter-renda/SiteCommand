-- Add is_private flag to documents table
-- Private folders are hidden from external (subcontractor) users

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for filtering private documents
CREATE INDEX IF NOT EXISTS idx_documents_is_private ON documents (project_id, is_private);

-- Create storage bucket for project documents (public so URLs are accessible)
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-documents', 'project-documents', true)
ON CONFLICT (id) DO NOTHING;
