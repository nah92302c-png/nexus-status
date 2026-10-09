import type { Metadata } from "next";
import { ServiceForm } from "@/components/admin/service-form";

export const metadata: Metadata = { title: "Add service" };

export default function NewServicePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Add service</h1>
      <p className="mt-1 text-sm text-slate-400">
        Create a new status entry for the public dashboard.
      </p>
      <div className="mt-6 rounded-2xl border border-app-border bg-app-surface p-6">
        <ServiceForm mode="create" />
      </div>
    </div>
  );
}