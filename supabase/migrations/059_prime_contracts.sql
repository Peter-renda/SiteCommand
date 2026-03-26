-- Prime Contracts table
create table if not exists prime_contracts (
  id                            uuid primary key default gen_random_uuid(),
  project_id                    uuid not null references projects(id) on delete cascade,
  contract_number               integer not null,
  title                         text not null default '',
  owner_client                  text not null default '',
  contractor                    text not null default '',
  architect_engineer            text not null default '',
  status                        text not null default 'Draft',
  erp_status                    text,
  executed                      boolean not null default false,
  default_retainage             numeric(5,2) not null default 0,
  description                   text not null default '',
  inclusions                    text not null default '',
  exclusions                    text not null default '',
  start_date                    date,
  estimated_completion_date     date,
  actual_completion_date        date,
  signed_contract_received_date date,
  contract_termination_date     date,
  is_private                    boolean not null default true,
  sov_view_allowed              boolean not null default false,
  original_contract_amount      numeric(15,2) not null default 0,
  approved_change_orders        numeric(15,2) not null default 0,
  pending_change_orders         numeric(15,2) not null default 0,
  draft_change_orders           numeric(15,2) not null default 0,
  invoiced                      numeric(15,2) not null default 0,
  payments_received             numeric(15,2) not null default 0,
  attachments_count             integer not null default 0,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now(),
  deleted_at                    timestamptz,

  unique (project_id, contract_number)
);

create index if not exists prime_contracts_project_id_idx on prime_contracts(project_id);
