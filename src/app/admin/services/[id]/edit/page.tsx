import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { getServerSupabase } from "@/lib/supabase/server";
import { getServiceById } from "@/lib/services/repository";
import { ServiceForm } from "@/components/admin/service-form";

export const metadata: Metadata = { title: "Edit service" };
export const dynamic = "force-dynamic";

export default async function EditServicePage({
  params,
}: PageProps<"/admin/services/[id]/edit">) {
  const { id } = await params;
  if (!isSupabaseConfigured()) redirect("/login");
  const client = await getServerSupabase();
  const service = await getServiceById(client, id);
  if (!service) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Edit {service.name}</h1>
      <p className="mt-1 text-sm text-slate-400">
        Update the service record. Status changes are written to the audit log.
      </p>
      <div className="mt-6 rounded-2xl border border-app-border bg-app-surface p-6">
        <ServiceForm mode="edit" service={service} />
      </div>
    </div>
  );
}