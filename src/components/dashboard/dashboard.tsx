"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Service } from "@/lib/types";
import { SERVICE_STATUSES, STATUS_META } from "@/lib/types";
import { DEFAULT_FILTER, filterServices, type DashboardFilter } from "@/lib/filters";
import { countByStatus, overallStatus } from "@/lib/status";
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

  const setQuery = (query: string) => setFilter((f) => ({ ...f, query }));
  const setStatus = (status: DashboardFilter["status"]) =>
    setFilter((f) => ({ ...f, status }));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
            NEXUS
          </p>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">System Status</h1>
        </div>
        {demo ? <DemoBanner /> : null}
      </div>

      <div className="space-y-6">
        <OverallBanner overall={overall} counts={counts} />

        {liveError ? (
          <p role="status" className="text-sm text-amber-300">
            {liveError}
          </p>
        ) : null}

        <section aria-label="Filter services" className="space-y-3">
          <div>
            <label htmlFor="service-search" className="sr-only">
              Search services
            </label>
            <input
              id="service-search"
              type="search"
              value={filter.query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search services…"
              className="w-full rounded-lg border border-nexus-border bg-nexus-surface px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-nexus-accent focus:outline-none focus:ring-2 focus:ring-nexus-accent/30"
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
                  ? "border-nexus-accent bg-nexus-accent/15 text-cyan-300"
                  : "border-nexus-border bg-nexus-surface text-slate-300 hover:border-slate-500",
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
                      ? "border-nexus-accent bg-nexus-accent/15 text-cyan-300"
                      : "border-nexus-border bg-nexus-surface text-slate-300 hover:border-slate-500",
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
          <p className="rounded-xl border border-nexus-border bg-nexus-surface p-6 text-center text-sm text-slate-400">
            {services.length === 0
              ? "No services have been published yet."
              : "No services match the current search or filter."}
          </p>
        ) : (
          <ul className="grid gap-3">
            {visible.map((service) => (
              <StatusCard key={service.id} service={service} />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}