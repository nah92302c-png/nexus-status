import type { Service } from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";

interface StatusCardProps {
  service: Service;
}

/** A single service row on the public dashboard. */
export function StatusCard({ service }: StatusCardProps) {
  return (
    <li
      data-testid="status-card"
      className="rounded-xl border border-nexus-border bg-nexus-surface p-4 shadow-sm transition-colors hover:border-nexus-accent/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-white">
            {service.name}
          </h3>
          {service.description ? (
            <p className="mt-0.5 text-sm text-slate-400">{service.description}</p>
          ) : null}
        </div>
        <StatusBadge status={service.status} />
      </div>
      {service.announcement ? (
        <p className="mt-3 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm text-sky-200">
          {service.announcement}
        </p>
      ) : null}
    </li>
  );
}