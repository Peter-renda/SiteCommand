BEGIN;

CREATE TABLE IF NOT EXISTS project_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID NULL REFERENCES project_locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, path)
);

CREATE INDEX IF NOT EXISTS idx_project_locations_project_id ON project_locations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_locations_parent_id ON project_locations(parent_id);

CREATE TABLE IF NOT EXISTS timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT NULL,
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ NULL,
  deleted_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  CHECK (status IN ('draft', 'submitted', 'approved', 'completed')),
  UNIQUE(project_id, work_date)
);

CREATE INDEX IF NOT EXISTS idx_timesheets_project_id_work_date ON timesheets(project_id, work_date);
CREATE INDEX IF NOT EXISTS idx_timesheets_deleted_at ON timesheets(deleted_at);

CREATE TABLE IF NOT EXISTS timesheet_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timesheet_id UUID NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL DEFAULT 'employee',
  resource_name TEXT NOT NULL,
  resource_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  start_time TIME NULL,
  stop_time TIME NULL,
  lunch_minutes INTEGER NOT NULL DEFAULT 0,
  total_hours NUMERIC(8,2) NOT NULL DEFAULT 0,
  time_type TEXT NOT NULL DEFAULT 'regular',
  billable BOOLEAN NOT NULL DEFAULT true,
  enforce_time_type_rules BOOLEAN NOT NULL DEFAULT false,
  cost_code TEXT NULL,
  cost_type TEXT NULL,
  location_id UUID NULL REFERENCES project_locations(id) ON DELETE SET NULL,
  location_path TEXT NULL,
  description TEXT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (resource_type IN ('employee', 'equipment')),
  CHECK (status IN ('draft', 'submitted', 'approved', 'completed')),
  CHECK (time_type IN ('regular', 'double_time', 'exempt', 'holiday', 'overtime', 'pto', 'salary', 'vacation'))
);

CREATE INDEX IF NOT EXISTS idx_timesheet_entries_timesheet_id ON timesheet_entries(timesheet_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_project_id ON timesheet_entries(project_id);

CREATE TABLE IF NOT EXISTS timesheet_entry_quantities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timesheet_entry_id UUID NOT NULL REFERENCES timesheet_entries(id) ON DELETE CASCADE,
  units_installed NUMERIC(14,4) NOT NULL DEFAULT 0,
  uom TEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(timesheet_entry_id)
);

CREATE INDEX IF NOT EXISTS idx_timesheet_entry_quantities_entry_id ON timesheet_entry_quantities(timesheet_entry_id);

COMMIT;
