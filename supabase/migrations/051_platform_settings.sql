-- Platform-level key/value settings store.
-- Used for runtime configuration such as APS (Autodesk Platform Services)
-- credentials that are managed through the Site Command admin UI rather than
-- hard-coded environment variables.
--
-- Access is restricted to users with role = 'site_admin'.

CREATE TABLE IF NOT EXISTS platform_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
