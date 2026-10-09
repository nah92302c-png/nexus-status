-- 0004_storage.sql
-- Storage bucket + policies for service images uploaded from the admin panel.
--
-- The bucket is public so the dashboard can render the artwork without auth;
-- only administrators (the `admins` allow-list) may upload, replace or delete.
--
-- Every statement is guarded so this file is a harmless no-op on a database
-- without the Supabase `storage` schema (for example the embedded PGlite used
-- by the test suite). Apply after 0001-0003. Safe to run more than once.

-- ---------------------------------------------------------------------------
-- Bucket
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'storage' and table_name = 'buckets'
  ) then
    raise notice 'storage schema not found; skipping storage setup';
    return;
  end if;

  insert into storage.buckets (id, name, public)
  values ('service-icons', 'service-icons', true)
  on conflict (id) do update set public = excluded.public;
end;
$$;

-- ---------------------------------------------------------------------------
-- Object policies
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'storage' and table_name = 'objects'
  ) then
    return;
  end if;

  execute $p$ drop policy if exists "service_icons_public_read" on storage.objects $p$;
  execute $p$
    create policy "service_icons_public_read"
      on storage.objects
      for select
      to anon, authenticated
      using (bucket_id = 'service-icons')
  $p$;

  execute $p$ drop policy if exists "service_icons_admin_insert" on storage.objects $p$;
  execute $p$
    create policy "service_icons_admin_insert"
      on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'service-icons' and public.is_admin())
  $p$;

  execute $p$ drop policy if exists "service_icons_admin_update" on storage.objects $p$;
  execute $p$
    create policy "service_icons_admin_update"
      on storage.objects
      for update
      to authenticated
      using (bucket_id = 'service-icons' and public.is_admin())
      with check (bucket_id = 'service-icons' and public.is_admin())
  $p$;

  execute $p$ drop policy if exists "service_icons_admin_delete" on storage.objects $p$;
  execute $p$
    create policy "service_icons_admin_delete"
      on storage.objects
      for delete
      to authenticated
      using (bucket_id = 'service-icons' and public.is_admin())
  $p$;
end;
$$;
