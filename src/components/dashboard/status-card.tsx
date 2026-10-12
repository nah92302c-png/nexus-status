import type { Service } from "@/lib/types";
import { STATUS_META } from "@/lib/types";
import { ServiceIcon } from "./service-icon";

interface StatusCardProps {
  service: Service;
}

/** A single service card on the public dashboard — vertical layout with large image. */
export function StatusCard({ service }: StatusCardProps) {
  const meta = STATUS_META[service.status];

  return (
    <article
      data-testid="status-card"
      className="product-card"
      data-product={service.slug}
      data-status={service.status}
      data-updated-at={service.last_checked_at ? Math.floor(new Date(service.last_checked_at).getTime() / 1000) : 0}
      data-search={`${service.name} ${service.slug}`}
    >
      <div className="product-art">
        <ServiceIcon name={service.name} iconUrl={service.icon_url} />
      </div>
      <div className="product-body">
        <h2>{service.name}</h2>
        <span className={`badge ${service.status}`}>
          <i aria-hidden="true" />
          <span className="badge-label">{meta.label}</span>
        </span>
      </div>
    </article>
  );
}