create table if not exists public.admin_allowlist (
  email text primary key,
  active boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);

alter table public.admin_allowlist enable row level security;
