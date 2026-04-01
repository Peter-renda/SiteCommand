-- ============================================================
-- Change Events
-- Tracks potential changes to a project before they become
-- formal change orders.
-- ============================================================

CREATE TABLE IF NOT EXISTS change_events (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  -- Sequential number per project (e.g. 1, 2, 3)
  number              INTEGER     NOT NULL,
  title               TEXT        NOT NULL DEFAULT '',
  -- 'Open' | 'Closed' | 'Pending' | 'Void'
  status              TEXT        NOT NULL DEFAULT 'Open',
  -- 'Emails' | 'Meetings' | 'RFIs'
  origin              TEXT,
  -- 'Allowance' | 'Contingency' | 'Owner Change' | 'TBD' | 'Transfer'
  type                TEXT,
  -- Change reason category
  change_reason       TEXT,
  -- 'In Scope' | 'Out of Scope' | 'TBD'
  scope               TEXT,
  expecting_revenue   BOOLEAN     NOT NULL DEFAULT false,
  -- 'Match Revenue to Latest Cost' | 'Enter Manually' | 'Quantity x Unit Cost'
  revenue_source      TEXT,
  prime_contract      TEXT,
  description         TEXT,
  created_by          UUID        REFERENCES users(id) ON DELETE SET NULL,
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS change_event_line_items (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  change_event_id     UUID        NOT NULL REFERENCES change_events(id) ON DELETE CASCADE,
  budget_code         TEXT,
  description         TEXT,
  vendor              TEXT,
  contract_number     TEXT,
  unit_of_measure     TEXT,
  rev_unit_qty        NUMERIC(15,4),
  rev_unit_cost       NUMERIC(15,2),
  rev_rom             NUMERIC(15,2),
  cost_unit_qty       NUMERIC(15,4),
  cost_unit_cost      NUMERIC(15,2),
  cost_rom            NUMERIC(15,2),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS change_events_project_id_idx
  ON change_events(project_id);

CREATE INDEX IF NOT EXISTS change_event_line_items_change_event_id_idx
  ON change_event_line_items(change_event_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_change_events_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS change_events_updated_at ON change_events;
CREATE TRIGGER change_events_updated_at
  BEFORE UPDATE ON change_events
  FOR EACH ROW EXECUTE FUNCTION update_change_events_updated_at();
