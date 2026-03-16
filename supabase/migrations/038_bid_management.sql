-- Run in Supabase SQL Editor

-- Bid packages (scope bundles sent out for competitive bidding)
CREATE TABLE IF NOT EXISTS bid_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  scope_of_work TEXT,
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft', -- draft | open | leveling | awarded | cancelled
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual bids from subcontractors on a package
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_package_id UUID NOT NULL REFERENCES bid_packages(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'invited', -- invited | viewed | submitted | declined | awarded
  base_amount NUMERIC(15,2),
  notes TEXT,
  submitted_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bid_packages_project_id_idx ON bid_packages(project_id);
CREATE INDEX IF NOT EXISTS bids_bid_package_id_idx ON bids(bid_package_id);
CREATE INDEX IF NOT EXISTS bids_project_id_idx ON bids(project_id);
