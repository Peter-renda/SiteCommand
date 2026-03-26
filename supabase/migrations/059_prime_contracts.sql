-- ============================================================
-- Prime Contracts + Schedule of Values
-- Safe to run whether the table already exists or not
-- ============================================================

-- 1. Create prime_contracts if it doesn't exist
CREATE TABLE IF NOT EXISTS prime_contracts (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id                    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  contract_number               INTEGER NOT NULL,
  title                         TEXT NOT NULL DEFAULT '',
  owner_client                  TEXT NOT NULL DEFAULT '',
  contractor                    TEXT NOT NULL DEFAULT '',
  architect_engineer            TEXT NOT NULL DEFAULT '',
  status                        TEXT NOT NULL DEFAULT 'Draft',
  erp_status                    TEXT,
  executed                      BOOLEAN NOT NULL DEFAULT false,
  default_retainage             NUMERIC(5,2) NOT NULL DEFAULT 0,
  description                   TEXT NOT NULL DEFAULT '',
  inclusions                    TEXT NOT NULL DEFAULT '',
  exclusions                    TEXT NOT NULL DEFAULT '',
  start_date                    DATE,
  estimated_completion_date     DATE,
  actual_completion_date        DATE,
  signed_contract_received_date DATE,
  contract_termination_date     DATE,
  is_private                    BOOLEAN NOT NULL DEFAULT true,
  sov_view_allowed              BOOLEAN NOT NULL DEFAULT false,
  original_contract_amount      NUMERIC(15,2) NOT NULL DEFAULT 0,
  approved_change_orders        NUMERIC(15,2) NOT NULL DEFAULT 0,
  pending_change_orders         NUMERIC(15,2) NOT NULL DEFAULT 0,
  draft_change_orders           NUMERIC(15,2) NOT NULL DEFAULT 0,
  invoiced                      NUMERIC(15,2) NOT NULL DEFAULT 0,
  payments_received             NUMERIC(15,2) NOT NULL DEFAULT 0,
  attachments_count             INTEGER NOT NULL DEFAULT 0,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                    TIMESTAMPTZ
);

-- 2. Add any missing columns (safe if column already exists)
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS contract_number               INTEGER NOT NULL DEFAULT 0;
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS title                         TEXT NOT NULL DEFAULT '';
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS owner_client                  TEXT NOT NULL DEFAULT '';
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS contractor                    TEXT NOT NULL DEFAULT '';
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS architect_engineer            TEXT NOT NULL DEFAULT '';
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS status                        TEXT NOT NULL DEFAULT 'Draft';
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS erp_status                    TEXT;
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS executed                      BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS default_retainage             NUMERIC(5,2) NOT NULL DEFAULT 0;
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS description                   TEXT NOT NULL DEFAULT '';
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS inclusions                    TEXT NOT NULL DEFAULT '';
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS exclusions                    TEXT NOT NULL DEFAULT '';
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS start_date                    DATE;
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS estimated_completion_date     DATE;
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS actual_completion_date        DATE;
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS signed_contract_received_date DATE;
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS contract_termination_date     DATE;
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS is_private                    BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS sov_view_allowed              BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS original_contract_amount      NUMERIC(15,2) NOT NULL DEFAULT 0;
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS approved_change_orders        NUMERIC(15,2) NOT NULL DEFAULT 0;
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS pending_change_orders         NUMERIC(15,2) NOT NULL DEFAULT 0;
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS draft_change_orders           NUMERIC(15,2) NOT NULL DEFAULT 0;
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS invoiced                      NUMERIC(15,2) NOT NULL DEFAULT 0;
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS payments_received             NUMERIC(15,2) NOT NULL DEFAULT 0;
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS attachments_count             INTEGER NOT NULL DEFAULT 0;
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE prime_contracts ADD COLUMN IF NOT EXISTS deleted_at                    TIMESTAMPTZ;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS prime_contracts_project_id_idx ON prime_contracts(project_id);
CREATE INDEX IF NOT EXISTS prime_contracts_deleted_at_idx ON prime_contracts(deleted_at);

-- 4. Unique constraint on (project_id, contract_number) — skip if already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'prime_contracts_project_id_contract_number_key'
  ) THEN
    ALTER TABLE prime_contracts ADD CONSTRAINT prime_contracts_project_id_contract_number_key
      UNIQUE (project_id, contract_number);
  END IF;
END $$;

-- ============================================================
-- Schedule of Values line items for prime contracts
-- Supports 100+ line items per contract with grouping
-- ============================================================
CREATE TABLE IF NOT EXISTS prime_contract_sov_items (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prime_contract_id            UUID NOT NULL REFERENCES prime_contracts(id) ON DELETE CASCADE,
  project_id                   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  is_group_header              BOOLEAN NOT NULL DEFAULT false,
  group_name                   TEXT NOT NULL DEFAULT '',
  budget_code                  TEXT NOT NULL DEFAULT '',
  description                  TEXT NOT NULL DEFAULT '',
  qty                          NUMERIC(15,4) NOT NULL DEFAULT 0,
  uom                          TEXT NOT NULL DEFAULT '',
  unit_cost                    NUMERIC(15,2) NOT NULL DEFAULT 0,
  scheduled_value              NUMERIC(15,2) NOT NULL DEFAULT 0,
  -- Billing / application columns (AIA G703 style)
  work_completed_prev          NUMERIC(15,2) NOT NULL DEFAULT 0,
  work_completed_this_period   NUMERIC(15,2) NOT NULL DEFAULT 0,
  materials_stored             NUMERIC(15,2) NOT NULL DEFAULT 0,
  billed_to_date               NUMERIC(15,2) NOT NULL DEFAULT 0,
  retainage_pct                NUMERIC(5,2) NOT NULL DEFAULT 0,
  retainage_amount             NUMERIC(15,2) NOT NULL DEFAULT 0,
  sort_order                   INTEGER NOT NULL DEFAULT 0,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS prime_contract_sov_items_contract_id_idx ON prime_contract_sov_items(prime_contract_id);
CREATE INDEX IF NOT EXISTS prime_contract_sov_items_project_id_idx  ON prime_contract_sov_items(project_id);
CREATE INDEX IF NOT EXISTS prime_contract_sov_items_sort_order_idx  ON prime_contract_sov_items(prime_contract_id, sort_order);

-- ============================================================
-- Reload PostgREST schema cache so changes are visible
-- immediately without a server restart
-- ============================================================
NOTIFY pgrst, 'reload schema';
