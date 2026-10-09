import type { Service } from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { ServiceIcon } from "./service-icon";

interface StatusCardProps {
  service: Service;
}

/** A single service card on the public dashboard. */
export function StatusCard({ service }: StatusCardProps) {
  return (
    <li data-testid="status-card" className="status-card">
      <ServiceIcon name={service.name} iconUrl={service.icon_url} />

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-semibold text-white">
          {service.name}
        </h3>
        {service.description ? (
          <p className="mt-0.5 line-clamp-2 text-sm text-app-muted">
            {service.description}
          </p>
        ) : null}
        {service.announcement ? (
          <p className="mt-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 text-xs text-sky-200">
            {service.announcement}
          </p>
        ) : null}
      </div>

      <div className="shrink-0">
        <StatusBadge status={service.status} />
      </div>
    </li>
  );
}
