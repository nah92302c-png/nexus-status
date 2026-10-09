import { describe, expect, it } from "vitest";
import { filterServices, matchesQuery } from "@/lib/filters";
import type { Service } from "@/lib/types";

function makeService(partial: Partial<Service>): Service {
  return {
    id: crypto.randomUUID(),
    name: "Service",
    slug: "service",
    description: null,
    icon_url: null,
    status: "unknown",
    status_mode: "manual",
    status_source: "manual",
    announcement: null,
    sort_order: 1,
    is_visible: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    last_checked_at: null,
    ...partial,
  };
}

const services = [
  makeService({ name: "MW3", status: "online" }),
  makeService({ name: "BO6", status: "offline" }),
  makeService({ name: "ARC Raiders", status: "online" }),
];

describe("matchesQuery", () => {
  it("is case-insensitive", () => {
    expect(matchesQuery(services[0], "mw3")).toBe(true);
    expect(matchesQuery(services[0], "MW3")).toBe(true);
    expect(matchesQuery(services[0], "  Mw3  ")).toBe(true);
  });

  it("matches partial names", () => {
    expect(matchesQuery(services[2], "arc")).toBe(true);
  });

  it("returns true for an empty query", () => {
    expect(matchesQuery(services[0], "   ")).toBe(true);
  });
});

describe("filterServices", () => {
  it("filters by status", () => {
    const result = filterServices(services, { query: "", status: "online" });
    expect(result.map((s) => s.name)).toEqual(["MW3", "ARC Raiders"]);
  });

  it("combines search and status filters (AND semantics)", () => {
    const result = filterServices(services, { query: "arc", status: "online" });
    expect(result.map((s) => s.name)).toEqual(["ARC Raiders"]);

    const none = filterServices(services, { query: "arc", status: "offline" });
    expect(none).toHaveLength(0);
  });

  it("returns everything for the default filter", () => {
    expect(filterServices(services, { query: "", status: "all" })).toHaveLength(
      3,
    );
  });
});
