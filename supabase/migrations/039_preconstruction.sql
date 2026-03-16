-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS preconstruction_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general', -- permits | design | entitlements | subcontracts | financing | general
  status TEXT NOT NULL DEFAULT 'not_started', -- not_started | in_progress | complete | blocked
  due_date DATE,
  assigned_to TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
