CREATE TABLE IF NOT EXISTS contractor_invitations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  contact_id   UUID REFERENCES directory_contacts(id) ON DELETE SET NULL,
  email        TEXT NOT NULL,
  contact_name TEXT,
  token        TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  accepted_at  TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  created_at   TIMESTAMPTZ DEFAULT now()
);

