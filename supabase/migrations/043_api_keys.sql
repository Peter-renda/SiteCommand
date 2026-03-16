create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  created_by uuid references users(id),
  name text not null,
  key_prefix text not null,          -- first 16 chars shown to user, e.g. "sc_live_a1b2c3d4"
  key_hash text not null,            -- bcrypt hash of full key
  last_used_at timestamptz,
  created_at timestamptz default now(),
  revoked_at timestamptz
);
create index if not exists api_keys_company_idx on api_keys(company_id);

create table if not exists webhooks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  created_by uuid references users(id),
  name text not null,
  url text not null,
  events text[] not null default '{}',   -- e.g. ['project.created', 'rfi.created']
  secret text not null,                   -- HMAC signing secret (shown once)
  is_active boolean default true,
  created_at timestamptz default now()
);
create index if not exists webhooks_company_idx on webhooks(company_id);
