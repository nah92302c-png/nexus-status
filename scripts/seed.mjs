// Seed the eight initial NEXUS STATUS services through the Supabase REST API.
//
//   npm run seed
//
// Requirements: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in
// .env.local (loaded by `node --env-file-if-exists`).
//
// Idempotency: `ignoreDuplicates` maps to `ON CONFLICT (slug) DO NOTHING`, so
// re-running never creates duplicates and NEVER overwrites administrator
// changes (status, visibility, ordering, text). New rows start as "unknown".

import { createClient } from "@supabase/supabase-js";
import { SEED_SERVICES } from "./seed-data.mjs";

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

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const rows = SEED_SERVICES.map(({ name, slug, description, sort_order }) => ({
  name,
  slug,
  description,
  sort_order,
  status: "unknown",
  status_mode: "manual",
  status_source: "manual",
  is_visible: true,
}));

const { error } = await supabase
  .from("services")
  .upsert(rows, { onConflict: "slug", ignoreDuplicates: true });

if (error) {
  console.error(`✗ Seed failed: ${error.message}`);
  process.exit(1);
}

const { count, error: countError } = await supabase
  .from("services")
  .select("id", { count: "exact", head: true });

if (countError) {
  console.error(`✗ Seed ran, but the follow-up count failed: ${countError.message}`);
  process.exit(1);
}

console.log(`✓ Seed complete. ${count} service(s) present.`);
console.log("  Existing rows were left untouched (ON CONFLICT DO NOTHING).");
