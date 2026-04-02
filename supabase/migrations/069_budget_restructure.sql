-- Restructure budget_line_items to align with column definitions:
-- • Rename direct_costs → job_to_date_costs (ERP source field)
-- • Add commitments_invoiced (auto-populated from commitment invoices)
-- • Drop forecast_to_complete (now a calculated field in the UI)

ALTER TABLE budget_line_items
  RENAME COLUMN direct_costs TO job_to_date_costs;

ALTER TABLE budget_line_items
  ADD COLUMN IF NOT EXISTS commitments_invoiced NUMERIC(15,2) NOT NULL DEFAULT 0;

ALTER TABLE budget_line_items
  DROP COLUMN IF EXISTS forecast_to_complete;
