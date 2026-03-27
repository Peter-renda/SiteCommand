-- Per-company integration credentials.
-- Each company's super_admin manages their own third-party connections
-- (e.g. Sage Intacct) independently through Settings → Integrations.
--
-- Intentionally separate from platform_settings (which is SiteCommand-
-- internal: APS keys, etc.) so company admins have no visibility into
-- platform-level config.

CREATE TABLE IF NOT EXISTS company_integrations (
  company_id  UUID  NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  key         TEXT  NOT NULL,
  value       TEXT  NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, key)
);

-- Only super_admins of the company read/write their own rows.
-- Row-level security is not enabled here (we enforce access in API routes),
-- consistent with the rest of the codebase (003_disable_rls.sql).
