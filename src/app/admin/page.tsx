import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { countByStatus, overallStatus } from "@/lib/status";
import { isSupabaseConfigured } from "@/lib/env";
import { getServerSupabase } from "@/lib/supabase/server";
import { listAllServices } from "@/lib/services/repository";
import { AdminServicesList } from "@/components/admin/admin-services-list";
import { OverallBanner } from "@/components/dashboard/overall-banner";

export const metadata: Metadata = { title: "Services" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  if (!isSupabaseConfigured()) redirect("/login");

  const client = await getServerSupabase();
  const services = await listAllServices(client);
  const visible = services.filter((service) => service.is_visible);
  const overall = overallStatus(visible);
  const counts = countByStatus(visible);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Services</h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage service records, statuses, visibility and ordering.
        </p>
      </div>

      <OverallBanner overall={overall} counts={counts} />

      <AdminServicesList services={services} />
    </div>
  );
}