CREATE TABLE IF NOT EXISTS transmittals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  transmittal_number INT NOT NULL,
  subject TEXT,
  to_id UUID REFERENCES directory_contacts(id) ON DELETE SET NULL,
  cc_contacts JSONB DEFAULT '[]',
  sent_via TEXT,
  private BOOLEAN DEFAULT FALSE,
  submitted_for JSONB DEFAULT '[]',
  action_as_noted JSONB DEFAULT '[]',
  due_by DATE,
  sent_date DATE,
  items JSONB DEFAULT '[]',
  comments TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, transmittal_number)
);
