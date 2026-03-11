-- Budget line items
CREATE TABLE IF NOT EXISTS budget_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  cost_code TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  original_budget_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  budget_modifications NUMERIC(15,2) NOT NULL DEFAULT 0,
  approved_cos NUMERIC(15,2) NOT NULL DEFAULT 0,
  pending_budget_changes NUMERIC(15,2) NOT NULL DEFAULT 0,
  committed_costs NUMERIC(15,2) NOT NULL DEFAULT 0,
  direct_costs NUMERIC(15,2) NOT NULL DEFAULT 0,
  pending_cost_changes NUMERIC(15,2) NOT NULL DEFAULT 0,
  forecast_to_complete NUMERIC(15,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Budget snapshots (point-in-time freeze of all line items)
CREATE TABLE IF NOT EXISTS budget_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  snapshot_data JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
