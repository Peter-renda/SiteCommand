create table if not exists scope_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  division_code text not null,
  division_name text not null,
  section_code text,
  section_name text,
  scope_text text not null,
  sort_order integer default 0,
  created_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists scope_items_project_idx on scope_items(project_id);
