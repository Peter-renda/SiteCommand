-- ============================================================
-- Migration 057: User-level tool access overrides
-- ============================================================
-- Adds an allowed_tools column to org_members so company admins
-- can restrict which tools an individual user can access.
--
-- NULL  = inherit all company-level enabled_features (no restriction)
-- Array = the specific tool slugs this user is allowed to use
--         (intersection with the company's enabled_features applies)
-- ============================================================

ALTER TABLE org_members
  ADD COLUMN IF NOT EXISTS allowed_tools TEXT[] DEFAULT NULL;
