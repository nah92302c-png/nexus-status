import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { getServerSupabase } from "@/lib/supabase/server";
import { listAudit } from "@/lib/services/repository";
import { AuditTable } from "@/components/admin/audit-table";

export const metadata: Metadata = { title: "Audit log" };
export const dynamic = "force-dynamic";

function parsePagination(searchParams: Record<string, string | string[] | undefined>) {
  const rawLimit = searchParams.limit ?? "25";
  const rawOffset = searchParams.offset ?? "0";
  const value = (raw: string | string[] | undefined) =>
    typeof raw === "string" ? Number(raw) : NaN;
  const limit = Number.isFinite(value(rawLimit)) ? Math.floor(value(rawLimit)) : 25;
  const offset = Number.isFinite(value(rawOffset))
    ? Math.max(0, Math.floor(value(rawOffset)))
    : 0;
  return { limit, offset };
}

export default async function AuditHistoryPage({
  searchParams,
}: PageProps<"/admin/audit">) {
  const { limit, offset } = parsePagination(await searchParams);
  if (!isSupabaseConfigured()) redirect("/login");
  const client = await getServerSupabase();
  const page = await listAudit(client, { limit, offset });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Audit log</h1>
      <p className="mt-1 text-sm text-slate-400">
        Append-only record of administrative changes to services.
      </p>
      <div className="mt-6">
        <AuditTable page={page} />
      </div>
    </div>
  );
}