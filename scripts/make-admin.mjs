// Create (or promote) an administrator.
//
//   npm run admin:create -- admin@example.com "a-strong-password"
//
// It creates the Supabase Auth user if needed, then adds them to the `admins`
// allow-list. The allow-list is the ONLY thing that grants admin access — see
// supabase/migrations/0002_rls.sql and src/lib/auth.ts.

import { createClient } from "@supabase/supabase-js";

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`✗ Missing ${name}. Copy .env.example to .env.local and fill it in.`);
    process.exit(1);
  }
  return value;
}

const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

const email = (process.argv[2] ?? process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = process.argv[3] ?? process.env.ADMIN_PASSWORD ?? "";

if (!email) {
  console.error("Usage: npm run admin:create -- <email> [password]");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findUserIdByEmail(target) {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) throw error;
  const match = data.users.find(
    (user) => (user.email ?? "").toLowerCase() === target,
  );
  return match?.id ?? null;
}

let userId = null;

if (password) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    const alreadyExists =
      error.code === "email_exists" || /already/i.test(error.message);
    if (!alreadyExists) {
      console.error(`✗ Could not create the auth user: ${error.message}`);
      process.exit(1);
    }
  } else {
    userId = data.user.id;
  }
}

if (!userId) {
  try {
    userId = await findUserIdByEmail(email);
  } catch (error) {
    console.error(`✗ Could not look up users: ${error.message}`);
    process.exit(1);
  }
  if (!userId) {
    console.error(
      `✗ No auth user exists for ${email}. Pass a password to create one:`,
    );
    console.error(`  npm run admin:create -- ${email} "a-strong-password"`);
    process.exit(1);
  }
}

const { error: linkError } = await supabase
  .from("admins")
  .upsert({ user_id: userId, email }, { onConflict: "user_id" });

if (linkError) {
  console.error(`✗ Could not add to the admins allow-list: ${linkError.message}`);
  process.exit(1);
}

console.log(`✓ ${email} is now an administrator (user ${userId}).`);
console.log("  Sign in at /login with that email and password.");
