-- 0002_rls.sql
-- Row Level Security for STATUS.
-- Apply after 0001_init.sql.

-- ---------------------------------------------------------------------------
-- Admin check
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER so the check itself is not subject to RLS on public.admins
-- and cannot be bypassed by the caller. search_path is pinned.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a where a.user_id = auth.uid()
  );
$$;

comment on function public.is_admin() is
  'True when the current JWT subject is listed in public.admins.';

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
alter table public.services  enable row level security;
alter table public.audit_log enable row level security;
alter table public.admins    enable row level security;

-- ---------------------------------------------------------------------------
-- services policies
-- ---------------------------------------------------------------------------
drop policy if exists services_public_read on public.services;
create policy services_public_read
  on public.services
  for select
  to anon, authenticated
  using (is_visible = true);

drop policy if exists services_admin_read on public.services;
create policy services_admin_read
  on public.services
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists services_admin_insert on public.services;
create policy services_admin_insert
  on public.services
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists services_admin_update on public.services;
create policy services_admin_update
  on public.services
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists services_admin_delete on public.services;
create policy services_admin_delete
  on public.services
  for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- audit_log policies
-- ---------------------------------------------------------------------------
-- Readable by admins only. Appendable by admins only, and the actor identity
-- must match the caller (no forging another administrator).
drop policy if exists audit_admin_read on public.audit_log;
create policy audit_admin_read
  on public.audit_log
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists audit_admin_insert on public.audit_log;
create policy audit_admin_insert
  on public.audit_log
  for insert
  to authenticated
  with check (public.is_admin() and changed_by = auth.uid());

-- No UPDATE or DELETE policies: audit history is append-only for API clients.

-- ---------------------------------------------------------------------------
-- admins policies
-- ---------------------------------------------------------------------------
-- Admins can read the allow-list; users may read their own row. There are no
-- INSERT/UPDATE/DELETE policies, so privilege changes require service-role or
-- direct SQL access.
drop policy if exists admins_admin_read on public.admins;
create policy admins_admin_read
  on public.admins
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists admins_self_read on public.admins;
create policy admins_self_read
  on public.admins
  for select
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------
-- Supabase pre-creates the anon, authenticated and service_role roles. Grants
-- are intentionally broad; RLS is the enforcement layer. service_role bypasses
-- RLS by design and must never reach the browser.
grant usage on schema public to anon, authenticated;
grant select on public.services to anon, authenticated;
grant select, insert, update, delete on public.services to authenticated;
grant select, insert on public.audit_log to authenticated;
grant select on public.admins to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
