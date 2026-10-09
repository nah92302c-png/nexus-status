"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Service, ServiceStatus } from "@/lib/types";
import { SERVICE_STATUSES, STATUS_META } from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";

interface AdminServicesListProps {
  services: Service[];
}

interface ApiErrorLike {
  ok: false;
  error?: { message?: string };
}

function messageFrom(body: unknown): string {
  const candidate = body as ApiErrorLike;
  return candidate?.error?.message ?? "The request failed. Please try again.";
}

export function AdminServicesList({ services }: AdminServicesListProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (id: string | null, request: Promise<Response>) => {
    setBusyId(id);
    setError(null);
    try {
      const response = await request;
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(messageFrom(body));
        return;
      }
      router.refresh();
    } catch {
      setError("The request could not be completed. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const changeStatus = (service: Service, status: ServiceStatus) => {
    if (status === service.status) return;
    void run(service.id, fetch(`/api/admin/services/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }));
  };

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= services.length) return;
    const ordered = services.slice();
    const [item] = ordered.splice(index, 1);
    ordered.splice(target, 0, item);
    void run(null, fetch("/api/admin/services/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ordered.map((s) => s.id) }),
    }));
  };

  const remove = (service: Service) => {
    if (!window.confirm(`Delete "${service.name}"? This cannot be undone.`)) return;
    void run(service.id, fetch(`/api/admin/services/${service.id}`, {
      method: "DELETE",
    }));
  };

  return (
    <section aria-label="Managed services">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          {services.length} {services.length === 1 ? "service" : "services"} in
          your account
        </p>
        <Link
          href="/admin/services/new"
          className="rounded-lg bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-black transition-colors hover:bg-cyan-400"
        >
          + Add service
        </Link>
      </div>

      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
        >
          {error}
        </p>
      ) : null}

      {services.length === 0 ? (
        <p className="rounded-xl border border-app-border bg-app-surface p-6 text-center text-sm text-slate-400">
          No services yet. Add your first service to get started.
        </p>
      ) : (
        <ul data-testid="admin-services-list" className="space-y-2">
          {services.map((service, index) => {
            const visible = service.is_visible;
            return (
              <li
                key={service.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-app-border bg-app-surface p-3.5"
              >
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    aria-label={`Move ${service.name} up`}
                    disabled={index === 0 || busyId !== null}
                    onClick={() => move(index, -1)}
                    className="rounded border border-app-border px-1.5 text-xs text-slate-400 hover:text-white disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${service.name} down`}
                    disabled={index === services.length - 1 || busyId !== null}
                    onClick={() => move(index, 1)}
                    className="rounded border border-app-border px-1.5 text-xs text-slate-400 hover:text-white disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold text-white">{service.name}</h3>
                    {!visible ? (
                      <span className="rounded-full border border-slate-600/50 bg-slate-800/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        Hidden
                      </span>
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    /{service.slug}
                    {service.description ? ` — ${service.description}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={service.status} size="sm" />
                  <label className="sr-only" htmlFor={`status-${service.id}`}>
                    Status for {service.name}
                  </label>
                  <select
                    id={`status-${service.id}`}
                    value={service.status}
                    disabled={busyId !== null}
                    onChange={(event) =>
                      changeStatus(service, event.target.value as ServiceStatus)
                    }
                    className="rounded-lg border border-app-border bg-app-surface px-2 py-1.5 text-xs text-slate-200 focus:border-app-accent focus:outline-none disabled:opacity-50"
                  >
                    {SERVICE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_META[status].label}
                      </option>
                    ))}
                  </select>

                  <Link
                    href={`/admin/services/${service.id}/edit`}
                    className="rounded-lg border border-app-border px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:border-app-accent/50 hover:text-white"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(service)}
                    disabled={busyId !== null}
                    className="rounded-lg border border-app-border px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:border-rose-500/50 hover:text-rose-300 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}