// Verify the Supabase connection and that the schema + seed look correct.
//
//   npm run db:verify
//
// Read-only. Never prints secrets.

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

let failures = 0;

console.log("Checking tables…");
for (const table of ["services", "admins", "audit_log"]) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) {
    console.error(`  ✗ ${table}: ${error.message}`);
    failures += 1;
  } else {
    console.log(`  ✓ ${table}: ${count} row(s)`);
  }
}

console.log("Checking seed…");
const { data, error } = await supabase.from("services").select("slug");
if (error) {
  console.error(`  ✗ Could not read services: ${error.message}`);
  failures += 1;
} else {
  const present = new Set(data.map((row) => row.slug));
  const missing = SEED_SERVICES.filter((service) => !present.has(service.slug));
  if (missing.length > 0) {
    console.error(
      `  ✗ Missing seeded services: ${missing.map((s) => s.slug).join(", ")}`,
    );
    console.error("    Run `npm run seed` to add them.");
    failures += 1;
  } else {
    console.log(`  ✓ All ${SEED_SERVICES.length} seeded services are present.`);
  }
}

if (failures > 0) {
  console.error(`\n✗ ${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\n✓ Database looks good.");
