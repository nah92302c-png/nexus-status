-- 0003_realtime.sql
-- Enable Supabase Realtime on the services table so public viewers can receive
-- status changes without a manual refresh.
--
-- Realtime honours Row Level Security, so anonymous subscribers only receive
-- rows allowed by the `services_public_read` policy.
--
-- The dashboard also polls on an interval (see NEXT_PUBLIC_POLL_INTERVAL_MS),
-- so live updates still work even if Realtime is disabled or unavailable.

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.services;
    exception
      when duplicate_object then null;  -- already added
    end;
  end if;
end;
$$;
