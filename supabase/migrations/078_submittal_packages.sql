CREATE TABLE IF NOT EXISTS submittal_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  package_number INT NOT NULL,
  title TEXT NOT NULL,
  specification_id UUID REFERENCES project_specifications(id) ON DELETE SET NULL,
  description TEXT,
  attachments JSONB DEFAULT '[]',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, package_number)
);

CREATE TABLE IF NOT EXISTS submittal_package_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES submittal_packages(id) ON DELETE CASCADE,
  submittal_id UUID NOT NULL REFERENCES submittals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(package_id, submittal_id)
);
