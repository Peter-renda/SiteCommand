-- ============================================================
-- Migration 031: Super Admin Role & Section-Level Permissions
-- ============================================================
-- Implements the full 4-tier company role hierarchy:
--   super_admin → admin → member → (external via user_type)
--
-- Also adds per-section access scoping for external collaborators
-- so a subcontractor can be restricted to e.g. only 'rfis' and
-- 'documents' within the project they were invited to.
-- ============================================================

-- ---------------------------------------------------------------
-- 1. Add billing_owner_id to companies
--    Tracks which user originally signed up and owns the Stripe
--    subscription. Only this user may change billing settings.
-- ---------------------------------------------------------------
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS billing_owner_id UUID REFERENCES users(id);

-- ---------------------------------------------------------------
-- 2. Add invited_role to invitations
--    When a super_admin sends an internal invite they can specify
--    whether the invitee should join as 'admin' or 'member'.
--    Defaults to 'member' (preserves existing behaviour).
-- ---------------------------------------------------------------
ALTER TABLE invitations
  ADD COLUMN IF NOT EXISTS invited_role TEXT NOT NULL DEFAULT 'member';

-- ---------------------------------------------------------------
-- 3. Add allowed_sections to project_memberships
--    NULL  → access to ALL sections of the project (default for
--             internal members and project_admins).
--    Array → access only to the listed tool sections, e.g.
--             ARRAY['rfis','documents','submittals']
--
--    Valid section keys match the sidebar nav slugs:
--      rfis | submittals | documents | drawings | photos |
--      schedule | tasks | punchlist | daily_log | directory
-- ---------------------------------------------------------------
ALTER TABLE project_memberships
  ADD COLUMN IF NOT EXISTS allowed_sections TEXT[] DEFAULT NULL;

-- ---------------------------------------------------------------
-- 4. Migrate existing company admins to super_admin / admin
--
--    Strategy: within each company the EARLIEST created user with
--    company_role = 'admin' becomes 'super_admin' (they are the
--    one who signed up and owns billing). All other admins keep
--    the new 'admin' role (they were previously promoted admins).
--
--    In practice most companies today have exactly one admin, so
--    this is a no-op for the majority of tenants.
-- ---------------------------------------------------------------

-- Step 4a: demote all current admins to plain 'admin' (new role)
-- We will re-promote the right one to 'super_admin' next.
UPDATE users
SET company_role = 'admin'
WHERE company_role = 'admin';   -- no-op value-wise, keeps the label

-- Step 4b: promote the earliest admin per company to super_admin
UPDATE users u
SET company_role = 'super_admin'
FROM (
  SELECT DISTINCT ON (company_id) id
  FROM users
  WHERE company_role = 'admin'
    AND company_id IS NOT NULL
  ORDER BY company_id, created_at ASC
) first_admins
WHERE u.id = first_admins.id;

-- Step 4c: backfill companies.billing_owner_id from super_admin users
UPDATE companies c
SET billing_owner_id = (
  SELECT id
  FROM users
  WHERE company_id = c.id
    AND company_role = 'super_admin'
  LIMIT 1
)
WHERE billing_owner_id IS NULL;

-- ---------------------------------------------------------------
-- 5. Index new columns for common query patterns
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_company_role
  ON users (company_id, company_role);

CREATE INDEX IF NOT EXISTS idx_project_memberships_allowed_sections
  ON project_memberships USING GIN (allowed_sections)
  WHERE allowed_sections IS NOT NULL;
