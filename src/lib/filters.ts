import type { Service, ServiceStatus } from "./types";

export interface DashboardFilter {
  /** Free-text query, matched case-insensitively against the service name. */
  query: string;
  /** "all" or a specific status. */
  status: ServiceStatus | "all";
}

export const DEFAULT_FILTER: DashboardFilter = { query: "", status: "all" };

/**
 * Case-insensitive search by service name. Trims and lowercases both sides so
 * "mw3", "MW3" and "  Mw3  " all match.
 */
export function matchesQuery(service: Service, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === "") return true;
  return service.name.toLowerCase().includes(needle);
}

/**
 * Apply search + status filter together. Both predicates must pass, so
 * combining them never yields an inconsistent set.
 */
export function filterServices(
  services: Service[],
  filter: DashboardFilter,
): Service[] {
  return services.filter(
    (service) =>
      matchesQuery(service, filter.query) &&
      (filter.status === "all" || service.status === filter.status),
  );
}
