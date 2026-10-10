import { STATUS_META, type ServiceStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

interface StatusBadgeProps {
  status: ServiceStatus;
  size?: "sm" | "md";
}

/**
 * Status indicator that is never colour-only: it always renders a non-colour
 * symbol plus the status label text, so it is legible without colour or vision.
 * Colours are driven by the `data-tone` attribute (see globals.css).
 */
export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const meta = STATUS_META[status];
  return (
    <span
      role="status"
      data-tone={meta.tone}
      title={meta.description}
      className={cn("badge", size === "sm" && "badge--sm")}
    >
      <span aria-hidden="true" className="badge-symbol">
        {meta.symbol}
      </span>
      <span>{meta.label}</span>
    </span>
  );
}
