-- Sage Intacct ERP sync log.
-- Records every sync attempt (success or failure) for commitments and
-- prime contracts so admins can diagnose issues without digging in logs.

CREATE TABLE IF NOT EXISTS erp_sync_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The table that was synced ('commitments' | 'prime_contracts')
  record_type   TEXT        NOT NULL,
  -- The local record id
  record_id     UUID        NOT NULL,
  -- 'success' | 'error'
  result        TEXT        NOT NULL,
  -- Sage Intacct object key returned on success (e.g. POPOKEY, SUBCONTRACTKEY)
  sage_key      TEXT,
  -- Full error message when result = 'error'
  error_message TEXT,
  -- The raw Sage XML response (truncated to 8 KB for storage efficiency)
  raw_response  TEXT,
  synced_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS erp_sync_logs_record_idx
  ON erp_sync_logs (record_type, record_id, synced_at DESC);
