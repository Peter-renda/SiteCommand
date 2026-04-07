-- Track source change events and budget linkage for commitment change orders.
ALTER TABLE change_orders
  ADD COLUMN IF NOT EXISTS source_change_event_ids UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS budget_codes TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS reviewer_notified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS change_orders_budget_codes_gin_idx
  ON change_orders USING GIN (budget_codes);

NOTIFY pgrst, 'reload schema';
