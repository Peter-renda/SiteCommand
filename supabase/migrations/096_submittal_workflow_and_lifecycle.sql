ALTER TABLE submittals
  ADD COLUMN IF NOT EXISTS approver_name_id UUID REFERENCES directory_contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS owners_manual TEXT,
  ADD COLUMN IF NOT EXISTS package_notes TEXT,
  ADD COLUMN IF NOT EXISTS confirmed_delivery_date DATE,
  ADD COLUMN IF NOT EXISTS actual_delivery_date DATE,
  ADD COLUMN IF NOT EXISTS workflow_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS related_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS distributed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS distributed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS duplicate_of_id UUID REFERENCES submittals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS submittals_project_is_deleted_idx
  ON submittals(project_id, is_deleted, submittal_number);

CREATE INDEX IF NOT EXISTS submittals_deleted_at_idx
  ON submittals(deleted_at);
