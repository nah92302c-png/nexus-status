import type { Service } from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { ServiceIcon } from "./service-icon";

interface StatusCardProps {
  service: Service;
}

/** A single service card on the public dashboard. */
export function StatusCard({ service }: StatusCardProps) {
  return (
    <li data-testid="status-card" className="product-card">
      <ServiceIcon name={service.name} iconUrl={service.icon_url} />

      <div className="product-body">
        <h2>{service.name}</h2>
        <StatusBadge status={service.status} />
      </div>

      {service.announcement ? (
        <p className="product-note">{service.announcement}</p>
      ) : null}
    </li>
  );
}
