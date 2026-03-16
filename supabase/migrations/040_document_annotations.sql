-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS document_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  project_id UUID NOT NULL,
  created_by UUID REFERENCES users(id),
  created_by_name TEXT,
  role TEXT, -- 'admin' | 'member' | 'external_viewer'
  annotation_data JSONB NOT NULL DEFAULT '[]', -- array of stroke/shape objects
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One annotation record per user per document (upsert pattern)
CREATE UNIQUE INDEX IF NOT EXISTS document_annotations_user_doc
  ON document_annotations(document_id, created_by);
