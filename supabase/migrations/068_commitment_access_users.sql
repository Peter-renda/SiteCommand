-- Per-commitment access list for non-admin users
CREATE TABLE IF NOT EXISTS commitment_access_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id UUID NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  directory_contact_id UUID NOT NULL REFERENCES directory_contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(commitment_id, directory_contact_id)
);

CREATE INDEX IF NOT EXISTS commitment_access_users_commitment_id_idx ON commitment_access_users(commitment_id);
