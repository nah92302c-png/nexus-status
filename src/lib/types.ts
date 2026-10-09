/**
 * Shared domain types for STATUS.
 *
 * Status values, labels and severity live here so they are defined once and
 * imported everywhere (UI, validation, API, tests). Do not duplicate these
 * lists in other files.
 */

export const SERVICE_STATUSES = [
  "online",
  "offline",
  "updating",
  "maintenance",
  "degraded",
  "unknown",
] as const;

export type ServiceStatus = (typeof SERVICE_STATUSES)[number];

export const STATUS_MODES = ["manual", "automatic"] as const;
export type StatusMode = (typeof STATUS_MODES)[number];

export type StatusTone = "ok" | "info" | "warning" | "critical" | "neutral";

export interface StatusMeta {
  /** Human readable label shown on cards, badges and filters. */
  label: string;
  /** Presentation tone; colour is never the only signal. */
  tone: StatusTone;
  /** Higher wins when computing the overall status. */
  severity: number;
  /** Non-colour glyph so status is distinguishable without colour. */
  symbol: string;
  /** Short explanation, used for tooltips and screen readers. */
  description: string;
}

/**
 * Severity order used by `overallStatus`:
 *   online(0) < unknown(1) < maintenance(2) < updating(3) < degraded(4) < offline(5)
 */
export const STATUS_META: Record<ServiceStatus, StatusMeta> = {
  online: {
    label: "Online",
    tone: "ok",
    severity: 0,
    symbol: "\u25CF",
    description: "Service is reported as operating normally.",
  },
  unknown: {
    label: "Unknown",
    tone: "neutral",
    severity: 1,
    symbol: "?",
    description: "Status has not been verified by a trusted source.",
  },
  maintenance: {
    label: "Maintenance",
    tone: "info",
    severity: 2,
    symbol: "\u25B2",
    description: "Planned maintenance is in progress.",
  },
  updating: {
    label: "Updating",
    tone: "info",
    severity: 3,
    symbol: "\u21BB",
    description: "An update is currently in progress.",
  },
  degraded: {
    label: "Degraded",
    tone: "warning",
    severity: 4,
    symbol: "\u25C6",
    description: "Service is available but performing below normal.",
  },
  offline: {
    label: "Offline",
    tone: "critical",
    severity: 5,
    symbol: "\u2715",
    description: "Service is reported as unavailable.",
  },
};

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  status: ServiceStatus;
  status_mode: StatusMode;
  status_source: string;
  announcement: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  last_checked_at: string | null;
}

export interface AuditEntry {
  id: string;
  service_id: string | null;
  service_name: string;
  previous_status: ServiceStatus | null;
  new_status: ServiceStatus;
  changed_by: string | null;
  changed_by_email: string | null;
  changed_at: string;
  change_note: string | null;
}

export interface AdminIdentity {
  user_id: string;
  email: string;
  role: "admin";
}

export type StatusCounts = Record<ServiceStatus, number> & { total: number };

export type OverallKey =
  | "operational"
  | "degraded"
  | "updating"
  | "maintenance"
  | "unknown"
  | "outage"
  | "empty";

export interface OverallStatus {
  key: OverallKey;
  label: string;
  description: string;
  tone: StatusTone;
}

/* ------------------------------- API shapes ------------------------------- */

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiErrorBody {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export type ApiResult<T> = ApiSuccess<T> | ApiErrorBody;

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
