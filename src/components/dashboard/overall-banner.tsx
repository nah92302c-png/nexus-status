import type { OverallStatus, ServiceStatus, StatusCounts, StatusTone } from "@/lib/types";
import { STATUS_META } from "@/lib/types";
import { cn } from "@/lib/cn";

const TONE_BANNER: Record<
  StatusTone,
  { border: string; glow: string; text: string }
> = {
  ok: {
    border: "border-emerald-500/25",
    glow: "bg-emerald-400 shadow-[0_0_12px_#34d39999]",
    text: "text-emerald-300",
  },
  info: {
    border: "border-sky-500/25",
    glow: "bg-sky-400 shadow-[0_0_12px_#38bdf899]",
    text: "text-sky-300",
  },
  warning: {
    border: "border-amber-500/25",
    glow: "bg-amber-400 shadow-[0_0_12px_#fbbf2499]",
    text: "text-amber-300",
  },
  critical: {
    border: "border-rose-500/25",
    glow: "bg-rose-400 shadow-[0_0_12px_#fb718599]",
    text: "text-rose-300",
  },
  neutral: {
    border: "border-app-border",
    glow: "bg-slate-400",
    text: "text-slate-300",
  },
};

/** Statuses shown in the summary, ordered by severity (worst first). */
const SUMMARY_STATUSES: ServiceStatus[] = [
  "offline",
  "degraded",
  "maintenance",
  "updating",
  "online",
  "unknown",
];

interface OverallBannerProps {
  overall: OverallStatus;
  counts: StatusCounts;
}

/** Hero panel: overall status plus a per-status count summary. */
export function OverallBanner({ overall, counts }: OverallBannerProps) {
  const tone = TONE_BANNER[overall.tone];
  return (
    <section
      aria-label="Overall status"
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-app-surface p-6 sm:p-7",
        tone.border,
      )}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={cn("h-3.5 w-3.5 shrink-0 rounded-full", tone.glow)}
        />
        <div>
          <h2 className={cn("text-xl font-bold sm:text-2xl", tone.text)}>
            {overall.label}
          </h2>
          <p className="mt-1 text-sm text-app-muted">{overall.description}</p>
        </div>
      </div>

      <ul className="mt-5 flex flex-wrap gap-2" aria-label="Status summary">
        <li
          data-testid="count-total"
          className="rounded-full border border-app-border bg-app-surface-2 px-2.5 py-1 text-xs font-medium text-slate-200"
        >
          {counts.total} {counts.total === 1 ? "service" : "services"}
        </li>
        {SUMMARY_STATUSES.map((status) => (
          <li
            key={status}
            data-testid={`count-${status}`}
            className="rounded-full border border-app-border bg-app-surface-2 px-2.5 py-1 text-xs font-medium text-slate-200"
          >
            <span aria-hidden="true">{STATUS_META[status].symbol}</span>{" "}
            {STATUS_META[status].label}: {counts[status]}
          </li>
        ))}
      </ul>
    </section>
  );
}
