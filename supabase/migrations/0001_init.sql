-- 0001_init.sql
-- STATUS core schema.
-- Apply this before 0002_rls.sql. Safe to run once on a fresh database.

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------
create table if not exists public.services (
  id              uuid primary key default gen_random_uuid(),
  name            text not null
                    check (char_length(btrim(name)) between 1 and 80),
  slug            text not null unique
                    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description     text
                    check (description is null or char_length(description) <= 500),
  icon_url        text
                    check (icon_url is null or icon_url ~* '^https?://'),
  status          text not null default 'unknown'
                    check (status in ('online','offline','updating','maintenance','degraded','unknown')),
  status_mode     text not null default 'manual'
                    check (status_mode in ('manual','automatic')),
  status_source   text not null default 'manual',
  announcement    text
                    check (announcement is null or char_length(announcement) <= 500),
  sort_order      integer not null default 0,
  is_visible      boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  last_checked_at timestamptz
);

comment on table public.services is
  'Status entries rendered on the public STATUS dashboard.';
comment on column public.services.status is
  'Manually curated or automatically observed status. "unknown" means not verified.';
comment on column public.services.status_source is
  'Where the current status came from, e.g. "manual" or an automated monitor name.';
comment on column public.services.last_checked_at is
  'When status was last verified by automation. Distinct from updated_at.';

create index if not exists services_visible_sort_idx
  on public.services (is_visible, sort_order, name);

-- Keep updated_at authoritative and server-generated.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- administrators
-- ---------------------------------------------------------------------------
-- Explicit allow-list of administrators. A Supabase Auth user is NOT an admin
-- unless a row exists here. Managed only through the dashboard/SQL, never
-- through the public API.
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  role       text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

comment on table public.admins is
  'Allow-list of users permitted to modify services and audit records.';

-- ---------------------------------------------------------------------------
-- audit_log
-- ---------------------------------------------------------------------------
-- service_name is denormalized so history survives service deletion.
-- service_id uses ON DELETE SET NULL for the same reason.
create table if not exists public.audit_log (
  id               uuid primary key default gen_random_uuid(),
  service_id       uuid references public.services(id) on delete set null,
  service_name     text not null,
  previous_status  text
                     check (previous_status is null or previous_status in
                       ('online','offline','updating','maintenance','degraded','unknown')),
  new_status       text not null
                     check (new_status in
                       ('online','offline','updating','maintenance','degraded','unknown')),
  changed_by       uuid,
  changed_by_email text,
  changed_at       timestamptz not null default now(),
  change_note      text
                     check (change_note is null or char_length(change_note) <= 500)
);

comment on table public.audit_log is
  'Append-only record of administrative service changes. Not writable by the public.';

create index if not exists audit_log_changed_at_idx
  on public.audit_log (changed_at desc);
create index if not exists audit_log_service_id_idx
  on public.audit_log (service_id);
