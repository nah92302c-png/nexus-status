"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Service } from "@/lib/types";
import { SERVICE_STATUSES, STATUS_META } from "@/lib/types";
import { filterServices, type DashboardFilter } from "@/lib/filters";
import { countByStatus } from "@/lib/status";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { publicServicesResponseSchema } from "@/lib/validation";
import { StatusCard } from "./status-card";

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

export function Dashboard({ initialServices, demo, pollIntervalMs }: DashboardProps) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [filter, setFilter] = useState<DashboardFilter>({
    query: "",
    status: "all",
  });
  const [liveError, setLiveError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [failures, setFailures] = useState(0);
  const [lastSuccess, setLastSuccess] = useState<number | null>(null);
  const liveTimer = useRef<number | null>(null);
  const countdownTimer = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    if (demo) return;
    setIsChecking(true);
    try {
      const next = await fetchVisibleServices();
      setServices(next);
      setLiveError(null);
      setFailures(0);
      setLastSuccess(Date.now());
    } catch {
      setFailures((f) => f + 1);
      setLiveError(
        "Status could not be retrieved. Automatic updates will retry shortly.",
      );
    } finally {
      setIsChecking(false);
    }
  }, [demo]);

  useEffect(() => {
    if (demo) return;

    const supabase = getBrowserSupabase();
    if (!supabase) return;

    const onLiveEvent = () => {
      refresh().catch(() => {
        setLiveError(
          "Status could not be retrieved. Automatic updates will retry shortly.",
        );
      });
    };

    const channel = supabase
      .channel("dashboard-services")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "services" },
        onLiveEvent,
      )
      .subscribe();

    // Polling as fallback
    liveTimer.current = window.setInterval(onLiveEvent, pollIntervalMs);

    // Countdown timer
    countdownTimer.current = window.setInterval(() => {}, 1000);

    return () => {
      supabase.removeChannel(channel);
      if (liveTimer.current !== null) window.clearInterval(liveTimer.current);
      if (countdownTimer.current !== null) window.clearInterval(countdownTimer.current);
    };
  }, [demo, pollIntervalMs, refresh]);

  const counts = useMemo(() => countByStatus(services), [services]);
  const visible = useMemo(() => filterServices(services, filter), [services, filter]);
  const isStale = liveError !== null;

  const setQuery = (query: string) => setFilter((f) => ({ ...f, query }));
  const setStatus = (status: DashboardFilter["status"]) =>
    setFilter((f) => ({ ...f, status }));

  return (
    <div className="site-shell">
      <header className="site-header" role="banner">
        <Link className="brand" href="/" aria-label="STATUS">
          <svg className="brand-mark" viewBox="0 0 40 40" aria-hidden="true">
            <path d="M7 31V9h7l12 15V9h7v22h-7L14 16v15Z" />
            <path className="brand-cut" d="m8 5 25 30" stroke="var(--color-app-bg)" strokeWidth="3" fill="none" />
          </svg>
          <h1>STATUS</h1>
        </Link>
        <div className="header-status">
          <div id="connection" className={`connection ${isStale ? "disconnected" : "connected"}`}>
            <span className="signal-dot" aria-hidden="true" />
            <span id="connection-label">{isStale ? "Status disconnected" : "Live status"}</span>
          </div>
          <div className="check-info">
            Last check
            <time id="last-checked">
              {lastSuccess ? new Date(lastSuccess).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "—"}
            </time>
          </div>
        </div>
      </header>

      <main id="products" aria-label="Products">
        <div className="toolbar">
          <div className="status-filters" role="group" aria-label="Filter by status">
            <button
              type="button"
              className={`filter ${filter.status === "all" ? "active" : ""}`}
              data-filter="all"
              aria-pressed={filter.status === "all"}
              onClick={() => setStatus("all")}
            >
              All <span>{counts.total}</span>
            </button>
            {SERVICE_STATUSES.map((status) => {
              const meta = STATUS_META[status];
              return (
                <button
                  key={status}
                  type="button"
                  className={`filter ${filter.status === status ? "active" : ""} ${status === "updating" ? "updating" : ""}`}
                  data-filter={status}
                  aria-pressed={filter.status === status}
                  onClick={() => setStatus(status)}
                >
                  <i className={`legend-dot ${status === "updating" ? "updating" : ""}`} aria-hidden="true" />
                  <span className="badge-label">{meta.label}</span> <span>{counts[status]}</span>
                </button>
              );
            })}
          </div>
          <div className="toolbar-actions">
            <label className="search">
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <path d="m13 13 4 4" fill="none" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              <span className="sr-only">Search services</span>
              <input
                id="product-search"
                type="search"
                value={filter.query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                autoComplete="off"
                maxLength={120}
              />
            </label>
            <button
              type="button"
              id="refresh"
              className="refresh-button"
              title="Refresh status"
              aria-label="Refresh status"
              aria-busy={isChecking}
              onClick={refresh}
              disabled={isChecking}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M16.3 7A7 7 0 1 0 17 11M16.5 2.5V7h-4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
        </div>

        {liveError ? (
          <p id="status-notice" className="notice" role="status">
            {liveError}
          </p>
        ) : null}

        <noscript>
          <div className="notice">
            Enable JavaScript for automatic updates and search. Reload this page to check the latest status.
          </div>
        </noscript>

        <div className="product-grid" id="product-grid" role="list">
          {visible.length === 0 ? (
            <div id="empty-state" className="empty-state">
              <h2>No services found</h2>
              <p>Try another name or status.</p>
              <button type="button" id="clear-filters" onClick={() => setFilter({ query: "", status: "all" })}>
                Clear filters
              </button>
            </div>
          ) : (
            visible.map((service) => (
              <StatusCard key={service.id} service={service} />
            ))
          )}
        </div>

        <p id="live-announcement" className="sr-only" aria-live="polite" aria-atomic="true" />
      </main>

      <footer className="site-footer">
        <span id="results-count">
          {visible.length === services.length
            ? `${services.length} services`
            : `${visible.length} of ${services.length} services`}
        </span>
        <span id="next-check">
          {isChecking
            ? "Checking status…"
            : failures > 0
            ? `Retry in ${Math.ceil(pollIntervalMs / 1000)}s`
            : `Next check in ${Math.ceil(pollIntervalMs / 1000)}s`}
        </span>
      </footer>
    </div>
  );
}

interface DashboardProps {
  initialServices: Service[];
  demo: boolean;
  pollIntervalMs: number;
}