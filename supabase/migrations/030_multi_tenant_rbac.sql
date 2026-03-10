-- ============================================================
-- Migration 030: Multi-Tenant RBAC (Procore-like Architecture)
-- ============================================================
-- Adds project-level role-based access control and support for
-- external collaborators (cross-tenant users scoped to specific
-- projects with limited permissions).
-- ============================================================

-- ---------------------------------------------------------------
-- 1. project_memberships: the "permission bridge" table
--    Maps users to projects with an explicit role.
--    Replaces the bare project_members join table.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_memberships (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  -- company_id of the PROJECT owner (Hamel Builders), not the user's company.
  -- Allows fast filtering: "all memberships Hamel owns".
  company_id UUID REFERENCES companies(id),
  -- project_admin : can manage project settings, members, invite externals
  -- member        : standard internal team member (read + write on project content)
  -- external_viewer: read-only collaborator from another organisation
  role       TEXT NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);

-- ---------------------------------------------------------------
-- 2. Migrate existing project_members rows into project_memberships
-- ---------------------------------------------------------------
INSERT INTO project_memberships (project_id, user_id, company_id, role)
SELECT
  pm.project_id,
  pm.user_id,
  p.company_id,
  'member'
FROM project_members pm
JOIN projects p ON p.id = pm.project_id
ON CONFLICT (project_id, user_id) DO NOTHING;

-- ---------------------------------------------------------------
-- 3. Extend invitations to support project-scoped external invites
--
--    invitation_type = 'internal'  → existing flow (join company as member)
--    invitation_type = 'external'  → new flow   (join a single project as
--                                                external_viewer, no company
--                                                seat consumed)
-- ---------------------------------------------------------------
ALTER TABLE invitations
  ADD COLUMN IF NOT EXISTS project_id       UUID REFERENCES projects(id),
  ADD COLUMN IF NOT EXISTS invitation_type  TEXT NOT NULL DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS project_role     TEXT          DEFAULT 'external_viewer';

-- ---------------------------------------------------------------
-- 4. Add user_type to users so the application can quickly
--    distinguish internal team members from external collaborators.
--
--    internal : belongs to a company; counts against seat limit
--    external : no company affiliation; scoped to invited projects only
-- ---------------------------------------------------------------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS user_type TEXT NOT NULL DEFAULT 'internal';
