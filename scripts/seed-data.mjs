/**
 * Canonical seed list for the eight initial NEXUS STATUS services.
 *
 * Kept in sync with supabase/seed.sql by tests/seed-sync.test.ts, so the two
 * seeding paths (SQL and `npm run seed`) can never drift apart. New services
 * are always seeded with status "unknown" — availability is never invented.
 */
export const SEED_SERVICES = [
  {
    name: "MW3",
    slug: "mw3",
    description: "Call of Duty: Modern Warfare III service status.",
    sort_order: 1,
  },
  {
    name: "BO6",
    slug: "bo6",
    description: "Call of Duty: Black Ops 6 service status.",
    sort_order: 2,
  },
  {
    name: "BO7",
    slug: "bo7",
    description: "Call of Duty: Black Ops 7 service status.",
    sort_order: 3,
  },
  {
    name: "MW1",
    slug: "mw1",
    description: "Call of Duty: Modern Warfare service status.",
    sort_order: 4,
  },
  {
    name: "WARDOGS",
    slug: "wardogs",
    description: "WARDOGS service status.",
    sort_order: 5,
  },
  {
    name: "ARC Raiders",
    slug: "arc-raiders",
    description: "ARC Raiders service status.",
    sort_order: 6,
  },
  {
    name: "Spoofer",
    slug: "spoofer",
    description: "Spoofer service status.",
    sort_order: 7,
  },
  {
    name: "MW4",
    slug: "mw4",
    description: "Call of Duty: Modern Warfare 4 service status.",
    sort_order: 8,
  },
];
