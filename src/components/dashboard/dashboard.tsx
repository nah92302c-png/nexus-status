"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Service } from "@/lib/types";
import { SERVICE_STATUSES, STATUS_META } from "@/lib/types";
import { DEFAULT_FILTER, filterServices, type DashboardFilter } from "@/lib/filters";
import { countByStatus, overallStatus } from "@/lib/status";
import { formatUtcShort } from "@/lib/format";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { publicServicesResponseSchema } from "@/lib/validation";
import { cn } from "@/lib/cn";
import { StatusCard } from "./status-card";
import { OverallBanner } from "./overall-banner";
import { DemoBanner } from "./demo-banner";

interface DashboardProps {
  initialServices: Service[];
  demo: boolean;
  pollIntervalMs: number;
}

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
  const liveTimer = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    const next = await fetchVisibleServices();
    setServices(next);
    setLiveError(null);
  }, []);

  useEffect(() => {
    if (demo) return;

    const supabase = getBrowserSupabase();
    if (!supabase) return;

    const onLiveEvent = () => {
      refresh().catch(() =>
        setLiveError("Live updates are temporarily unavailable; showing the last known state."),
      );
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

  const overall = useMemo(() => overallStatus(services), [services]);
  const counts = useMemo(() => countByStatus(services), [services]);
  const visible = useMemo(() => filterServices(services, filter), [services, filter]);
  const updatedAt = useMemo(() => lastUpdatedAt(services), [services]);

  const setQuery = (query: string) => setFilter((f) => ({ ...f, query }));
  const setStatus = (status: DashboardFilter["status"]) =>
    setFilter((f) => ({ ...f, status }));

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-10 pt-9 sm:px-6">
      <section className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.6rem]">
          Live status
        </h1>
        <p className="mt-1 text-sm text-app-muted">
          Current availability of games and products.
        </p>
      </section>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3 text-xs text-app-muted">
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              demo ? "bg-amber-400" : "bg-emerald-400 shadow-[0_0_8px_#45d48380]",
            )}
          />
          {demo ? "Demo data" : "Live data"}
        </span>
        <span>
          Last updated <b className="font-semibold text-slate-200">{formatUtcShort(updatedAt)}</b>
        </span>
      </div>

      <div className="space-y-6">
        {demo ? <DemoBanner /> : null}

        <OverallBanner overall={overall} counts={counts} />

        {liveError ? (
          <p role="status" className="text-sm text-amber-300">
            {liveError}
          </p>
        ) : null}

        <section aria-label="Filter services" className="space-y-3">
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-slate-500"
            >
              ⌕
            </span>
            <label htmlFor="service-search" className="sr-only">
              Search services
            </label>
            <input
              id="service-search"
              type="search"
              value={filter.query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search services…"
              className="w-full rounded-lg border border-app-border bg-app-surface py-2.5 pl-9 pr-3.5 text-sm text-white placeholder:text-slate-500 focus:border-app-accent focus:outline-none focus:ring-2 focus:ring-app-accent/30"
            />
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
            <button
              type="button"
              aria-pressed={filter.status === "all"}
              onClick={() => setStatus("all")}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                filter.status === "all"
                  ? "border-app-accent bg-app-accent/15 text-cyan-300"
                  : "border-app-border bg-app-surface text-slate-300 hover:border-slate-500",
              )}
            >
              All ({counts.total})
            </button>
            {SERVICE_STATUSES.map((status) => {
              const meta = STATUS_META[status];
              const active = filter.status === status;
              return (
                <button
                  key={status}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStatus(status)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-app-accent bg-app-accent/15 text-cyan-300"
                      : "border-app-border bg-app-surface text-slate-300 hover:border-slate-500",
                  )}
                >
                  <span aria-hidden="true">{meta.symbol}</span> {meta.label} (
                  {counts[status]})
                </button>
              );
            })}
          </div>
        </section>

        {visible.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-app-border bg-app-surface p-8 text-center text-sm text-app-muted">
            {services.length === 0
              ? "No services have been published yet."
              : "No services match the current search or filter."}
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {visible.map((service) => (
              <StatusCard key={service.id} service={service} />
            ))}
          </ul>
        )}

        <p className="border-t border-white/5 pt-4 text-center text-xs text-app-muted">
          Status updates automatically. Last updated{" "}
          {formatUtcShort(updatedAt)}.
        </p>
      </div>
    </main>
  );
}
