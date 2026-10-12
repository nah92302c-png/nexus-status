import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { countByStatus, overallStatus } from "@/lib/status";
import { isSupabaseConfigured } from "@/lib/env";
import { getServerSupabase } from "@/lib/supabase/server";
import { listAllServices } from "@/lib/services/repository";
import { AdminServicesList } from "@/components/admin/admin-services-list";

export const metadata: Metadata = { title: "Admin — Services" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  if (!isSupabaseConfigured()) redirect("/login");

  const client = await getServerSupabase();
  const services = await listAllServices(client);
  const visible = services.filter((service) => service.is_visible);
  const overall = overallStatus(visible);
  const counts = countByStatus(visible);

  const tone =
    overall.tone === "ok"
      ? { border: "border-emerald-500/25", glow: "bg-emerald-400 shadow-[0_0_12px_#34d39999]", text: "text-emerald-300" }
      : overall.tone === "info"
      ? { border: "border-sky-500/25", glow: "bg-sky-400 shadow-[0_0_12px_#38bdf899]", text: "text-sky-300" }
      : overall.tone === "warning"
      ? { border: "border-amber-500/25", glow: "bg-amber-400 shadow-[0_0_12px_#fbbf2499]", text: "text-amber-300" }
      : overall.tone === "critical"
      ? { border: "border-rose-500/25", glow: "bg-rose-400 shadow-[0_0_12px_#fb718599]", text: "text-rose-300" }
      : { border: "border-app-border", glow: "bg-slate-400", text: "text-slate-300" };

  const SUMMARY_STATUSES = ["offline", "degraded", "maintenance", "updating", "online", "unknown"] as const;

  return (
    <div className="site-shell">
      <header className="site-header" role="banner">
        <a className="brand" href="/" aria-label="STATUS">
          <h1>STATUS</h1>
        </a>
        <div className="header-status">
          <div id="connection" className="connection connected">
            <span className="signal-dot" aria-hidden="true" />
            <span id="connection-label">Live status</span>
          </div>
          <div className="check-info">
            Last check <time id="last-checked">—</time>
          </div>
        </div>
      </header>

      <main id="products" aria-label="Admin Services">
        <div className="toolbar">
          <div className="status-filters" role="group" aria-label="Filter by status">
            <button
              type="button"
              className="filter active"
              data-filter="all"
              aria-pressed="true"
            >
              All <span>{counts.total}</span>
            </button>
            {["offline", "degraded", "maintenance", "updating", "online", "unknown"].map((status) => {
              const labels: Record<string, { label: string; symbol: string }> = {
                offline: { label: "Offline", symbol: "✕" },
                degraded: { label: "Degraded", symbol: "◆" },
                maintenance: { label: "Maintenance", symbol: "▲" },
                updating: { label: "Updating", symbol: "↻" },
                online: { label: "Online", symbol: "●" },
                unknown: { label: "Unknown", symbol: "?" },
              };
              const meta = labels[status];
              return (
                <button
                  key={status}
                  type="button"
                  className={`filter ${status === "updating" ? "updating" : ""}`}
                  data-filter={status}
                  aria-pressed="false"
                >
                  <i className={`legend-dot ${status === "updating" ? "updating" : ""}`} aria-hidden="true" />
                  <span className="badge-label">{meta.label}</span> <span>{counts[status as keyof typeof counts]}</span>
                </button>
              );
            })}
          </div>
          <div className="toolbar-actions">
            <a
              href="/admin/services/new"
              className="rounded-lg bg-app-accent px-3 py-1.5 text-[11px] font-medium text-black transition-colors hover:bg-app-accent-hover"
            >
              Add service
            </a>
          </div>
        </div>

        <section
          aria-label="Overall status"
          className={`relative overflow-hidden rounded-2xl border bg-app-panel p-6 sm:p-7 ${tone.border}`}
        >
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 rounded-full ${tone.glow}`} />
            <div>
              <h2 className={`text-xl font-bold sm:text-2xl ${tone.text}`}>{overall.label}</h2>
              <p className="mt-1 text-sm text-app-muted">{overall.description}</p>
            </div>
          </div>

          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Status summary">
            <li className="rounded-full border border-app-border bg-app-field px-2.5 py-1 text-xs font-medium text-slate-200">
              {counts.total} {counts.total === 1 ? "service" : "services"}
            </li>
            {SUMMARY_STATUSES.map((status) => {
              const labels: Record<string, { label: string; symbol: string }> = {
                offline: { label: "Offline", symbol: "✕" },
                degraded: { label: "Degraded", symbol: "◆" },
                maintenance: { label: "Maintenance", symbol: "▲" },
                updating: { label: "Updating", symbol: "↻" },
                online: { label: "Online", symbol: "●" },
                unknown: { label: "Unknown", symbol: "?" },
              };
              const meta = labels[status];
              return (
                <li
                  key={status}
                  className="rounded-full border border-app-border bg-app-field px-2.5 py-1 text-xs font-medium text-slate-200"
                >
                  <span aria-hidden="true">{meta.symbol}</span>{" "}{meta.label}: {counts[status as keyof typeof counts]}
                </li>
              );
            })}
          </ul>
        </section>

        <AdminServicesList services={services} />
      </main>

      <footer className="site-footer">
        <span>© 2026 STATUS · Independent status dashboard</span>
        <span>Admin panel</span>
      </footer>
    </div>
  );
}