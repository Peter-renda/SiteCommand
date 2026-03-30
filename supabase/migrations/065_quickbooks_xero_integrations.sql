-- QuickBooks Online and Xero integration support.
--
-- The company_integrations and platform_settings tables already exist and use
-- a generic key/value schema, so no new tables are needed for credential storage.
--
-- This migration adds an `integration` column to erp_sync_logs so that sync
-- history for QuickBooks and Xero can be distinguished from Sage records.
-- Existing Sage rows default to 'sage'.
--
-- New keys stored in company_integrations per-company (set via OAuth callback):
--   QBO_REALM_ID, QBO_ACCESS_TOKEN, QBO_REFRESH_TOKEN
--   XERO_TENANT_ID, XERO_ACCESS_TOKEN, XERO_REFRESH_TOKEN
--
-- New keys stored in platform_settings (set by site_admin):
--   QBO_CLIENT_ID, QBO_CLIENT_SECRET
--   XERO_CLIENT_ID, XERO_CLIENT_SECRET

ALTER TABLE erp_sync_logs
  ADD COLUMN IF NOT EXISTS integration TEXT NOT NULL DEFAULT 'sage';

-- Index for efficient per-integration log queries
CREATE INDEX IF NOT EXISTS erp_sync_logs_integration_idx
  ON erp_sync_logs (integration, record_type, record_id, synced_at DESC);

COMMENT ON COLUMN erp_sync_logs.integration IS
  'Which ERP system this log entry belongs to: sage | quickbooks | xero';
