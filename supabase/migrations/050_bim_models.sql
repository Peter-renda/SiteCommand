-- BIM models uploaded to Autodesk Platform Services (APS)
CREATE TABLE IF NOT EXISTS bim_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  aps_object_key TEXT NOT NULL,
  urn TEXT NOT NULL,
  translation_status TEXT NOT NULL DEFAULT 'pending',
  uploaded_by UUID REFERENCES users(id),
  uploaded_by_name TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bim_models_project_id_idx ON bim_models(project_id);

ALTER TABLE bim_models DISABLE ROW LEVEL SECURITY;
