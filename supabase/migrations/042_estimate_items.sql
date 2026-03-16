create table if not exists estimate_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  division_code text not null default '01',
  division_name text not null default 'General Requirements',
  cost_code text,
  description text not null,
  quantity numeric(14,4) default 1,
  unit text default 'LS',
  unit_cost numeric(14,2) default 0,
  total_cost numeric(14,2) generated always as (quantity * unit_cost) stored,
  notes text,
  sort_order integer default 0,
  created_by uuid references users(id),
  created_at timestamptz default now()
);
create index if not exists estimate_items_project_idx on estimate_items(project_id);
