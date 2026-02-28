CREATE TABLE IF NOT EXISTS directory_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'user', -- 'user', 'company', 'distribution_group'
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  permission TEXT, -- 'Architect/Engineer', 'Owner/Client', 'Subcontractor', 'Company Employee'
  group_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
