-- seed.sql
-- Repeatable seed for the eight initial STATUS services.
--
-- Idempotency contract:
--   * ON CONFLICT (slug) DO NOTHING  -> re-running never creates duplicates.
--   * Existing rows are never updated, so administrator changes (status,
--     visibility, ordering, text) always survive a reseed.
--   * New services are seeded with status = 'unknown' because availability has
--     not been verified. Do not invent live status.
--
-- Run with:  supabase db execute --file supabase/seed.sql
-- (or paste into the Supabase SQL editor).

insert into public.services
  (name, slug, description, status, status_mode, status_source, sort_order, is_visible)
values
  ('MW3',       'mw3',       'Call of Duty: Modern Warfare III service status.', 'unknown', 'manual', 'manual', 1, true),
  ('BO6',       'bo6',       'Call of Duty: Black Ops 6 service status.',        'unknown', 'manual', 'manual', 2, true),
  ('BO7',       'bo7',       'Call of Duty: Black Ops 7 service status.',        'unknown', 'manual', 'manual', 3, true),
  ('MW1',       'mw1',       'Call of Duty: Modern Warfare service status.',     'unknown', 'manual', 'manual', 4, true),
  ('WARDOGS',   'wardogs',   'WARDOGS service status.',                          'unknown', 'manual', 'manual', 5, true),
  ('ARC Raiders','arc-raiders','ARC Raiders service status.',                    'unknown', 'manual', 'manual', 6, true),
  ('Spoofer',   'spoofer',   'Spoofer service status.',                          'unknown', 'manual', 'manual', 7, true),
  ('MW4',       'mw4',       'Call of Duty: Modern Warfare 4 service status.',   'unknown', 'manual', 'manual', 8, true)
on conflict (slug) do nothing;
