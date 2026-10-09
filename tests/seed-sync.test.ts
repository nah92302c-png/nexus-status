// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SEED_SERVICES } from "../scripts/seed-data.mjs";

/**
 * The SQL seed (supabase/seed.sql) and the JS seeder (scripts/seed-data.mjs)
 * must describe the same eight services in the same order. If they drift, one
 * seeding path would produce a different set than the other.
 */
describe("seed definitions stay in sync", () => {
  const sql = readFileSync(
    new URL("../supabase/seed.sql", import.meta.url),
    "utf8",
  );
  const sqlRows = [
    ...sql.matchAll(/^\s*\(\s*'([^']+)'\s*,\s*'([^']+)'/gm),
  ].map((match) => ({ name: match[1], slug: match[2] }));

  it("seeds the same service names in the same order", () => {
    expect(sqlRows.map((row) => row.name)).toEqual(
      SEED_SERVICES.map((service) => service.name),
    );
  });

  it("seeds the same slugs in the same order", () => {
    expect(sqlRows.map((row) => row.slug)).toEqual(
      SEED_SERVICES.map((service) => service.slug),
    );
  });

  it("orders the seed 1..n", () => {
    expect(SEED_SERVICES.map((service) => service.sort_order)).toEqual(
      SEED_SERVICES.map((_, index) => index + 1),
    );
  });
});
