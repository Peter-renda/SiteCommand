-- Add project_roles JSONB column to store named role assignments
-- e.g. { "Project Manager": ["userId1"], "Executive": ["userId1", "userId2"] }
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS project_roles JSONB DEFAULT '{}';
