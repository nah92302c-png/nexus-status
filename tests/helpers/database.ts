import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

/**
 * Minimal stand-in for the Supabase `auth` schema so migrations that reference
 * `auth.users` / `auth.uid()` can run in embedded Postgres (PGlite).
 *
 * In real Supabase these already exist; this stub is used ONLY by tests.
 */
const AUTH_STUB = `
create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select (
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
  )::uuid
$$;
`;

/** Roles that Supabase pre-creates. */
const ROLES_STUB = `
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end;
$$;
`;

const MIGRATIONS = [
  "0001_init.sql",
  "0002_rls.sql",
  "0003_realtime.sql",
  "0004_storage.sql",
];

function read(relative: string): string {
  return readFileSync(path.join(process.cwd(), relative), "utf8");
}

export type TestDb = PGlite;

export async function createTestDatabase(): Promise<TestDb> {
  const db = new PGlite();
  await db.exec(ROLES_STUB);
  await db.exec(AUTH_STUB);
  for (const file of MIGRATIONS) {
    await db.exec(read(`supabase/migrations/${file}`));
  }
  // Supabase grants service_role full access by default; mirror that so the
  // embedded database behaves like a real project.
  await db.exec(`
    grant usage on schema public to service_role;
    grant all privileges on all tables in schema public to service_role;
  `);
  return db;
}

export async function seed(db: TestDb): Promise<void> {
  await db.exec(read("supabase/seed.sql"));
}

/** Run subsequent statements as the anonymous (public) role. */
export async function actAsAnon(db: TestDb): Promise<void> {
  await db.exec("reset role; set role anon;");
  await db.query("select set_config('request.jwt.claims', $1, false)", ["{}"]);
}

/** Run subsequent statements as an authenticated user. */
export async function actAsUser(db: TestDb, userId: string): Promise<void> {
  await db.exec("reset role; set role authenticated;");
  await db.query("select set_config('request.jwt.claims', $1, false)", [
    JSON.stringify({ sub: userId, role: "authenticated" }),
  ]);
}

/** Run subsequent statements with service-role privileges (bypasses RLS). */
export async function actAsServiceRole(db: TestDb): Promise<void> {
  await db.exec("reset role; set role service_role;");
}

export async function resetRole(db: TestDb): Promise<void> {
  await db.exec("reset role;");
  await db.query("select set_config('request.jwt.claims', '', false)");
}

/** Create an auth user + admin row (as the superuser, bypassing RLS). */
export async function createAdmin(
  db: TestDb,
  email = "admin@example.com",
): Promise<string> {
  await resetRole(db);
  const result = await db.query<{ id: string }>(
    "insert into auth.users (email) values ($1) returning id",
    [email],
  );
  const id = result.rows[0].id;
  await db.query(
    "insert into admins (user_id, email, role) values ($1, $2, 'admin')",
    [id, email],
  );
  return id;
}

/** Create a plain authenticated (non-admin) user. */
export async function createUser(
  db: TestDb,
  email = "user@example.com",
): Promise<string> {
  await resetRole(db);
  const result = await db.query<{ id: string }>(
    "insert into auth.users (email) values ($1) returning id",
    [email],
  );
  return result.rows[0].id;
}
