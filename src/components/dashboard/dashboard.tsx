"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Service } from "@/lib/types";
import { SERVICE_STATUSES, STATUS_META } from "@/lib/types";
import { DEFAULT_FILTER, filterServices, type DashboardFilter } from "@/lib/filters";
import { countByStatus } from "@/lib/status";
import { formatUtcShort } from "@/lib/format";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { publicServicesResponseSchema } from "@/lib/validation";
import { cn } from "@/lib/cn";
import { StatusCard } from "./status-card";
import { DemoBanner } from "./demo-banner";

interface DashboardProps {
  initialServices: Service[];
  demo: boolean;
  pollIntervalMs: number;
}

const LIVE_ERROR =
  "Live updates are temporarily unavailable; showing the last known state.";

async function fetchVisibleServices(): Promise<Service[]> {
  const response = await fetch("/api/services", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not refresh services (HTTP ${response.status}).`);
  }
  const body: unknown = await response.json();
  const parsed = publicServicesResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error("The services payload was not valid.");
  }
  return parsed.data.data;
}

/** Newest `updated_at` across the services, used for the "last updated" line. */
function lastUpdatedAt(services: Service[]): string | null {
  let newest: string | null = null;
  for (const service of services) {
    if (!service.updated_at) continue;
    if (newest === null || service.updated_at > newest) newest = service.updated_at;
  }
  return newest;
}

export function Dashboard({ initialServices, demo, pollIntervalMs }: DashboardProps) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [filter, setFilter] = useState<DashboardFilter>(DEFAULT_FILTER);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const liveTimer = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    const next = await fetchVisibleServices();
    setServices(next);
    setLiveError(null);
  }, []);

  const manualRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } catch {
      setLiveError(LIVE_ERROR);
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  useEffect(() => {
    if (demo) return;

    const supabase = getBrowserSupabase();
    if (!supabase) return;

    const onLiveEvent = () => {
      refresh().catch(() => setLiveError(LIVE_ERROR));
    };

    const channel = supabase
      .channel("dashboard-services")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "services" },
        onLiveEvent,
      )
      .subscribe();

    // Polling is a deliberate fallback: it keeps the dashboard correct even
    // when Realtime is unavailable or a manual status change was applied
    // outside the database (e.g. through a different server).
    liveTimer.current = window.setInterval(onLiveEvent, pollIntervalMs);

    return () => {
      supabase.removeChannel(channel);
      if (liveTimer.current !== null) window.clearInterval(liveTimer.current);
    };
  }, [demo, pollIntervalMs, refresh]);

  const counts = useMemo(() => countByStatus(services), [services]);
  const visible = useMemo(() => filterServices(services, filter), [services, filter]);
  const updatedAt = useMemo(() => lastUpdatedAt(services), [services]);

  const setQuery = (query: string) => setFilter((f) => ({ ...f, query }));
  const setStatus = (status: DashboardFilter["status"]) =>
    setFilter((f) => ({ ...f, status }));

  const connected = liveError === null;
  const connectionLabel = demo
    ? "Demo data"
    : connected
      ? "Live status"
      : "Reconnecting";

  return (
    <div className="site-shell flex min-h-screen flex-col">
      <a className="skip-link" href="#products">
        Skip to products
      </a>

      <header className="site-header">
        <Link className="brand" href="/" aria-label="STATUS home">
          <svg className="brand-mark" viewBox="0 0 40 40" aria-hidden="true">
            <rect
              x="3"
              y="3"
              width="34"
              height="34"
              rx="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            />
            <path
              d="M8 21h5l3-8 5 15 4-10 3 3h4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h1>STATUS</h1>
        </Link>

        <div className="header-status">
          <div className={cn("connection", !connected && "disconnected")}>
            <span className="signal-dot" />
            <span>{connectionLabel}</span>
          </div>
          <div className="check-info">
            Last updated <time>{formatUtcShort(updatedAt)}</time>
          </div>
        </div>
      </header>

      <main id="products" aria-label="Products" className="flex-1">
        <div className="toolbar">
          <div className="status-filters" role="group" aria-label="Filter by status">
            <button
              type="button"
              className={cn("filter", filter.status === "all" && "active")}
              aria-pressed={filter.status === "all"}
              data-testid="count-total"
              onClick={() => setStatus("all")}
            >
              All <span>{counts.total}</span>
            </button>
            {SERVICE_STATUSES.map((status) => {
              const meta = STATUS_META[status];
              const active = filter.status === status;
              return (
                <button
                  key={status}
                  type="button"
                  className={cn("filter", active && "active")}
                  aria-pressed={active}
                  data-testid={`count-${status}`}
                  onClick={() => setStatus(status)}
                >
                  <i className={cn("legend-dot", status)} aria-hidden="true" />
                  {meta.label} <span>{counts[status]}</span>
                </button>
              );
            })}
          </div>

          <div className="toolbar-actions">
            <label className="search">
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <circle cx="8.5" cy="8.5" r="5.5" />
                <path d="m13 13 4 4" />
              </svg>
              <span className="sr-only">Search services</span>
              <input
                id="service-search"
                type="search"
                value={filter.query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search…"
                autoComplete="off"
                maxLength={120}
              />
            </label>

            <button
              type="button"
              className="refresh-button"
              onClick={manualRefresh}
              aria-busy={refreshing}
              aria-label="Refresh status"
              title="Refresh status"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M16.3 7A7 7 0 1 0 17 11M16.5 2.5V7h-4.5" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {demo ? <DemoBanner /> : null}

          {liveError ? (
            <p role="status" className="notice">
              {liveError}
            </p>
          ) : null}

          {visible.length === 0 ? (
            <div className="empty-state">
              <h2>No services found</h2>
              <p>
                {services.length === 0
                  ? "No services have been published yet."
                  : "No services match the current search or filter."}
              </p>
            </div>
          ) : (
            <ul className="product-grid">
              {visible.map((service) => (
                <StatusCard key={service.id} service={service} />
              ))}
            </ul>
          )}
        </div>
      </main>

      <footer className="site-footer">
        <span>
          {counts.total} {counts.total === 1 ? "service" : "services"}
        </span>
        <span className="flex items-center gap-3">
          <span>
            Status updates automatically · Last updated {formatUtcShort(updatedAt)}
          </span>
          <Link href="/admin">Admin</Link>
        </span>
      </footer>
    </div>
  );
}
