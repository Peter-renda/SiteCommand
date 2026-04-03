-- ============================================================
-- Extend change_orders with form fields shown in the
-- New Potential Change Order UI.
-- ============================================================

ALTER TABLE change_orders
  ADD COLUMN IF NOT EXISTS change_reason                  TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description                    TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_private                     BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS executed                       BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS request_received_from          TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS schedule_impact                INTEGER,
  ADD COLUMN IF NOT EXISTS reference                      TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS signed_change_order_received_date DATE,
  ADD COLUMN IF NOT EXISTS location                       TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS field_change                   BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS paid_in_full                   BOOLEAN     NOT NULL DEFAULT false,
  -- 'none' | 'add_to_existing' | 'create_new'
  ADD COLUMN IF NOT EXISTS prime_contract_change_order    TEXT        NOT NULL DEFAULT 'none';

NOTIFY pgrst, 'reload schema';
