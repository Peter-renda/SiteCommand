-- Track the timestamp when a change order is first moved into Approved status.
-- Used to determine and display approval order in the Change Orders log.

ALTER TABLE change_orders
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS change_orders_approved_at_idx
  ON change_orders (project_id, type, approved_at DESC)
  WHERE deleted_at IS NULL;

NOTIFY pgrst, 'reload schema';
