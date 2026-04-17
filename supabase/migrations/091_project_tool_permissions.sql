-- Per-project, per-tool permission levels.
--
-- Separates "can this user access the project at all" (handled by
-- project_memberships / company match) from "what can they do inside a
-- given tool". Matches the Procore-style model of None / Read Only /
-- Standard / Admin levels per tool.

CREATE TABLE IF NOT EXISTS project_tool_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('none', 'read_only', 'standard', 'admin')),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, user_id, tool)
);

CREATE INDEX IF NOT EXISTS idx_project_tool_permissions_project_tool
  ON project_tool_permissions (project_id, tool);

CREATE INDEX IF NOT EXISTS idx_project_tool_permissions_user
  ON project_tool_permissions (user_id);
