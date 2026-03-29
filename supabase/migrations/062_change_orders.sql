-- ============================================================
-- Change Orders
-- Tracks change events against prime contracts and commitments.
-- erp_status mirrors the pattern used by commitments/prime_contracts
-- so change orders can be individually synced to Sage.
-- ============================================================

CREATE TABLE IF NOT EXISTS change_orders (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  -- Exactly one of prime_contract_id / commitment_id will be set
  prime_contract_id   UUID        REFERENCES prime_contracts(id) ON DELETE SET NULL,
  commitment_id       UUID        REFERENCES commitments(id) ON DELETE SET NULL,
  -- 'prime' | 'commitment'
  type                TEXT        NOT NULL,
  contract_name       TEXT        NOT NULL DEFAULT '',
  -- Zero-padded sequential number per project + type, e.g. "001"
  number              TEXT        NOT NULL DEFAULT '',
  revision            INTEGER     NOT NULL DEFAULT 0,
  title               TEXT        NOT NULL DEFAULT '',
  date_initiated      DATE,
  designated_reviewer TEXT,
  due_date            DATE,
  review_date         DATE,
  contract_company    TEXT        NOT NULL DEFAULT '',
  -- 'Draft' | 'Under Review' | 'Approved' | 'Rejected' | 'Void'
  status              TEXT        NOT NULL DEFAULT 'Draft',
  amount              NUMERIC(15,2) NOT NULL DEFAULT 0,
  is_locked           BOOLEAN     NOT NULL DEFAULT false,
  has_attachments     BOOLEAN     NOT NULL DEFAULT false,
  -- 'not_synced' | 'pending' | 'synced'
  erp_status          TEXT        NOT NULL DEFAULT 'not_synced',
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS change_orders_project_id_idx        ON change_orders(project_id);
CREATE INDEX IF NOT EXISTS change_orders_prime_contract_id_idx ON change_orders(prime_contract_id);
CREATE INDEX IF NOT EXISTS change_orders_commitment_id_idx     ON change_orders(commitment_id);
CREATE INDEX IF NOT EXISTS change_orders_deleted_at_idx        ON change_orders(deleted_at);

NOTIFY pgrst, 'reload schema';
