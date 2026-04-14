-- Audit trail for budget modifications (transfers between line items).
-- Each row in BudgetModificationModal produces one record per transfer line.

CREATE TABLE IF NOT EXISTS budget_modification_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_line_item_id   UUID REFERENCES budget_line_items(id) ON DELETE SET NULL,
  to_line_item_id     UUID REFERENCES budget_line_items(id) ON DELETE SET NULL,
  from_cost_code      TEXT NOT NULL DEFAULT '',
  to_cost_code        TEXT NOT NULL DEFAULT '',
  amount              NUMERIC(15,2) NOT NULL DEFAULT 0,
  notes               TEXT NOT NULL DEFAULT '',
  created_by          TEXT NOT NULL DEFAULT '',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS budget_modification_records_project_id
  ON budget_modification_records (project_id, created_at DESC);
