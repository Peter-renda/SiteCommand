-- Document tracking: users who subscribe to email notifications for a document/folder
CREATE TABLE IF NOT EXISTS document_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(document_id, user_id)
);

CREATE INDEX idx_document_tracking_document_id ON document_tracking(document_id);
CREATE INDEX idx_document_tracking_user_id ON document_tracking(user_id);

-- Document change history: audit log for all changes to documents/folders
CREATE TABLE IF NOT EXISTS document_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id),
  changed_by_name TEXT,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_document_change_history_document_id ON document_change_history(document_id);
CREATE INDEX idx_document_change_history_created_at ON document_change_history(created_at DESC);
