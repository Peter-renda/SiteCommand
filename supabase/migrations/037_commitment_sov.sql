-- Schedule of Values line items for commitments
CREATE TABLE IF NOT EXISTS commitment_sov_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id UUID NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  is_group_header BOOLEAN NOT NULL DEFAULT false,
  group_name TEXT NOT NULL DEFAULT '',
  change_event_line_item TEXT NOT NULL DEFAULT '',
  budget_code TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  qty NUMERIC(15,4) NOT NULL DEFAULT 0,
  uom TEXT NOT NULL DEFAULT '',
  unit_cost NUMERIC(15,2) NOT NULL DEFAULT 0,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  billed_to_date NUMERIC(15,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS commitment_sov_items_commitment_id_idx ON commitment_sov_items(commitment_id);
CREATE INDEX IF NOT EXISTS commitment_sov_items_project_id_idx ON commitment_sov_items(project_id);
