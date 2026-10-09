import type { Service } from "./types";

/**
 * Sample data for local UI development and UI tests only.
 *
 * This is NOT live data. When it is used, the interface shows a clear
 * "demo data" banner. In production, missing Supabase configuration produces a
 * configuration error instead of these records.
 */
const NAMES = [
  "MW3",
  "BO6",
  "BO7",
  "MW1",
  "WARDOGS",
  "ARC Raiders",
  "Spoofer",
  "MW4",
] as const;

const descriptions: Record<string, string> = {
  mw3: "Call of Duty: Modern Warfare III service status.",
  bo6: "Call of Duty: Black Ops 6 service status.",
  bo7: "Call of Duty: Black Ops 7 service status.",
  mw1: "Call of Duty: Modern Warfare service status.",
  wardogs: "WARDOGS service status.",
  "arc-raiders": "ARC Raiders service status.",
  spoofer: "Spoofer service status.",
  mw4: "Call of Duty: Modern Warfare 4 service status.",
};

export const demoSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Deterministic sample services (statuses all "unknown", matching the seed). */
export function getDemoServices(): Service[] {
  const now = "2026-01-01T00:00:00.000Z";
  return NAMES.map((name, index) => {
    const slug = demoSlug(name);
    return {
      id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      name,
      slug,
      description: descriptions[slug] ?? null,
      icon_url: null,
      status: "unknown" as const,
      status_mode: "manual" as const,
      status_source: "manual",
      announcement: null,
      sort_order: index + 1,
      is_visible: true,
      created_at: now,
      updated_at: now,
      last_checked_at: null,
    };
  });
}
