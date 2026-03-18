-- ============================================================
-- Migration 047: org_members Table + project_memberships.permission
-- ============================================================
-- Implements the recommended multi-tenant architecture:
--
--   organizations (companies) ← already exists as `companies`
--   org_members               ← NEW: explicit org-level membership table
--   project_memberships       ← EXTENDED: adds `permission` column
--
-- This migration is fully additive. All existing columns and
-- behaviour are preserved. New code should prefer org_members and
-- permission; legacy code using users.company_role and
-- project_memberships.role continues to work unchanged.
-- ============================================================

-- ---------------------------------------------------------------
-- 1. org_members
--    One row per user per organisation. Mirrors / supersedes the
--    denormalised users.company_role + users.company_id approach.
--
--    role values:
--      super_admin  – account owner; full billing + user management
--      admin        – can invite users, create projects; no billing
--      member       – standard user; needs explicit project access
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS org_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
  org_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, org_id),
  CONSTRAINT org_members_role_check
    CHECK (role IN ('super_admin', 'admin', 'member'))
);

CREATE INDEX IF NOT EXISTS idx_org_members_org_id   ON org_members (org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id  ON org_members (user_id);

-- ---------------------------------------------------------------
-- 2. Backfill org_members from users.company_id + company_role
--    Only internal users who already belong to a company are seeded.
-- ---------------------------------------------------------------
INSERT INTO org_members (user_id, org_id, role)
SELECT
  id,
  company_id,
  CASE company_role
    WHEN 'super_admin' THEN 'super_admin'
    WHEN 'admin'       THEN 'admin'
    ELSE                    'member'
  END
FROM users
WHERE company_id   IS NOT NULL
  AND company_role IS NOT NULL
  AND user_type    = 'internal'
ON CONFLICT (user_id, org_id) DO NOTHING;

-- ---------------------------------------------------------------
-- 3. Add permission column to project_memberships
--    read_only – user can view but not modify project content
--    write     – user can create, edit, and delete project content
--
--    Admins and super_admins are NOT evaluated here; they always
--    receive write via the checkProjectAccess logic (org-level bypass).
-- ---------------------------------------------------------------
ALTER TABLE project_memberships
  ADD COLUMN IF NOT EXISTS permission TEXT DEFAULT 'write';

ALTER TABLE project_memberships
  ADD CONSTRAINT project_memberships_permission_check
    CHECK (permission IN ('read_only', 'write'));

-- ---------------------------------------------------------------
-- 4. Backfill permission from the legacy role column
--    external_viewer → read_only  (limited collaborator)
--    project_admin   → write      (project manager)
--    member          → write      (standard internal user)
-- ---------------------------------------------------------------
UPDATE project_memberships
SET permission = CASE
  WHEN role = 'external_viewer' THEN 'read_only'
  ELSE 'write'
END
WHERE permission IS NULL OR permission = 'write';  -- safe to re-run

-- Enforce NOT NULL after backfill
ALTER TABLE project_memberships
  ALTER COLUMN permission SET NOT NULL;

-- ---------------------------------------------------------------
-- 5. Index the new permission column for quick filtering
--    (e.g. "show me all read_only members of this project")
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_project_memberships_permission
  ON project_memberships (project_id, permission);
