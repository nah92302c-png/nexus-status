import Link from "next/link";
import type { Service } from "@/lib/types";
import { getDemoServices } from "@/lib/demo-data";
import { getPollIntervalMs, isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { getServerSupabase } from "@/lib/supabase/server";
import { listVisibleServices } from "@/lib/services/repository";
import { Dashboard } from "@/components/dashboard/dashboard";
import { ConfigError } from "@/components/dashboard/config-error";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const configured = isSupabaseConfigured();
  const demo = isDemoMode();
  const showDemo = demo && !configured;

  let services: Service[];
  if (showDemo) {
    services = getDemoServices();
  } else if (configured) {
    const client = await getServerSupabase();
    services = await listVisibleServices(client);
  } else {
    // Production with a missing connection: show an honest configuration
    // error instead of fabricated sample data.
    return <ConfigError />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-white/5 bg-app-bg/85 backdrop-blur">
        <div className="mx-auto flex h-[70px] w-full max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="grid h-7 w-7 place-items-center rounded-md bg-[#f2f2f3] text-sm font-black tracking-tight text-[#111]"
            >
              S
            </span>
            <span className="text-sm font-extrabold tracking-[0.13em] text-white">
              STATUS
            </span>
          </div>

          <div className="flex items-center gap-4">
            {configured ? (
              <span className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#45d48380]" />
                Live
              </span>
            ) : null}
            {configured ? (
              <nav aria-label="Site">
                <Link
                  href="/admin"
                  className="rounded-lg border border-app-border px-3 py-1.5 text-[11px] font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
                >
                  Admin
                </Link>
              </nav>
            ) : null}
          </div>
        </div>
      </header>

      <Dashboard
        initialServices={services}
        demo={showDemo}
        pollIntervalMs={getPollIntervalMs()}
      />

      <footer className="border-t border-white/5 py-6">
        <p className="text-center text-[11px] text-slate-500">
          © 2026 STATUS · Independent status dashboard
        </p>
      </footer>
    </div>
  );
}
