import {
  SERVICE_STATUSES,
  STATUS_META,
  type OverallStatus,
  type Service,
  type ServiceStatus,
  type StatusCounts,
} from "./types";

/**
 * Compute the overall dashboard status from a set of *visible* services.
 *
 * Priority (highest first) — a single service at a higher severity determines
 * the overall state:
 *   offline     -> Service Disruption
 *   degraded    -> Degraded Performance
 *   updating    -> Update in Progress
 *   maintenance -> Scheduled Maintenance
 *   unknown     -> Status Partially Unknown
 *   (all online)-> All Systems Operational
 *
 * Rationale: an unverified service (unknown) must never be reported as fully
 * operational, so unknown ranks above online but below any known issue.
 */
const OVERALL_ORDER: ServiceStatus[] = [
  "offline",
  "degraded",
  "updating",
  "maintenance",
  "unknown",
];

const OVERALL_BY_STATUS: Record<
  Exclude<ServiceStatus, "online">,
  OverallStatus
> = {
  offline: {
    key: "outage",
    label: "Service Disruption",
    description: "At least one service is reported as offline.",
    tone: "critical",
  },
  degraded: {
    key: "degraded",
    label: "Degraded Performance",
    description: "At least one service is performing below normal.",
    tone: "warning",
  },
  updating: {
    key: "updating",
    label: "Update in Progress",
    description: "At least one service is currently updating.",
    tone: "info",
  },
  maintenance: {
    key: "maintenance",
    label: "Scheduled Maintenance",
    description: "At least one service is under maintenance.",
    tone: "info",
  },
  unknown: {
    key: "unknown",
    label: "Status Partially Unknown",
    description: "Some services have not been verified yet.",
    tone: "neutral",
  },
};

export function overallStatus(
  services: Pick<Service, "status">[],
): OverallStatus {
  if (services.length === 0) {
    return {
      key: "empty",
      label: "No Services",
      description: "There are no visible services to report on yet.",
      tone: "neutral",
    };
  }

  const present = new Set<ServiceStatus>(services.map((s) => s.status));
  for (const status of OVERALL_ORDER) {
    if (present.has(status)) {
      return OVERALL_BY_STATUS[status as Exclude<ServiceStatus, "online">];
    }
  }

  return {
    key: "operational",
    label: "All Systems Operational",
    description: "Every visible service is reported as online.",
    tone: "ok",
  };
}

export function countByStatus(
  services: Pick<Service, "status">[],
): StatusCounts {
  const counts = {
    online: 0,
    offline: 0,
    updating: 0,
    maintenance: 0,
    degraded: 0,
    unknown: 0,
    total: services.length,
  } as StatusCounts;

  for (const service of services) {
    counts[service.status] += 1;
  }
  return counts;
}

export function statusLabel(status: ServiceStatus): string {
  return STATUS_META[status].label;
}

export function isServiceStatus(value: unknown): value is ServiceStatus {
  return (
    typeof value === "string" &&
    (SERVICE_STATUSES as readonly string[]).includes(value)
  );
}
