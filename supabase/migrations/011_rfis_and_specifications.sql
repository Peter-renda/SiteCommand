-- Project specifications (referenced from admin / RFI form)
CREATE TABLE IF NOT EXISTS project_specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RFIs
CREATE TABLE IF NOT EXISTS rfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  rfi_number INT NOT NULL,
  subject TEXT,
  question TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'draft',
  rfi_manager_id UUID REFERENCES directory_contacts(id) ON DELETE SET NULL,
  received_from_id UUID REFERENCES directory_contacts(id) ON DELETE SET NULL,
  assignees JSONB DEFAULT '[]',
  distribution_list JSONB DEFAULT '[]',
  responsible_contractor_id UUID REFERENCES directory_contacts(id) ON DELETE SET NULL,
  specification_id UUID REFERENCES project_specifications(id) ON DELETE SET NULL,
  drawing_number TEXT,
  attachments JSONB DEFAULT '[]',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, rfi_number)
);

-- RFI responses
CREATE TABLE IF NOT EXISTS rfi_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfi_id UUID NOT NULL REFERENCES rfis(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
