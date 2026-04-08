-- Store commitment change-order schedule of values snapshots so downstream
-- budget and committed-cost calculations can use line-level amounts.
ALTER TABLE change_orders
  ADD COLUMN IF NOT EXISTS schedule_of_values JSONB NOT NULL DEFAULT '[]'::jsonb;

NOTIFY pgrst, 'reload schema';
