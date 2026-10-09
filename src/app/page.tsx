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
      <header className="border-b border-nexus-border bg-nexus-bg/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <p className="text-lg font-bold tracking-[0.15em] text-white">
            NEXUS <span className="text-cyan-400">STATUS</span>
          </p>
          {configured ? (
            <nav aria-label="Site">
              <Link
                href="/admin"
                className="rounded-lg border border-nexus-border bg-nexus-surface px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-nexus-accent/50 hover:text-white"
              >
                Admin
              </Link>
            </nav>
          ) : null}
        </div>
      </header>

      <Dashboard
        initialServices={services}
        demo={showDemo}
        pollIntervalMs={getPollIntervalMs()}
      />

      <footer className="border-t border-nexus-border py-6">
        <p className="text-center text-xs text-slate-500">
          NEXUS STATUS — automated service overview.
        </p>
      </footer>
    </div>
  );
}