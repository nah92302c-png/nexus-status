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
    return <ConfigError />;
  }

  return (
    <Dashboard
      initialServices={services}
      demo={showDemo}
      pollIntervalMs={getPollIntervalMs()}
    />
  );
}