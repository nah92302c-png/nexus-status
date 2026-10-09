import type { OverallStatus, StatusCounts, StatusTone } from "@/lib/types";
import { STATUS_META } from "@/lib/types";
import { cn } from "@/lib/cn";

const TONE_BANNER: Record<StatusTone, { background: string; text: string; glow: string }> = {
  ok: {
    background: "from-emerald-500/15 to-transparent border-emerald-500/30",
    text: "text-emerald-300",
    glow: "bg-emerald-400",
  },
  info: {
    background: "from-sky-500/15 to-transparent border-sky-500/30",
    text: "text-sky-300",
    glow: "bg-sky-400",
  },
  warning: {
    background: "from-amber-500/15 to-transparent border-amber-500/30",
    text: "text-amber-300",
    glow: "bg-amber-400",
  },
  critical: {
    background: "from-rose-500/15 to-transparent border-rose-500/30",
    text: "text-rose-300",
    glow: "bg-rose-400",
  },
  neutral: {
    background: "from-slate-500/15 to-transparent border-slate-500/30",
    text: "text-slate-300",
    glow: "bg-slate-400",
  },
};

interface OverallBannerProps {
  overall: OverallStatus;
  counts: StatusCounts;
}

/** Hero banner: overall status plus a per-status count summary. */
export function OverallBanner({ overall, counts }: OverallBannerProps) {
  const tone = TONE_BANNER[overall.tone];
  return (
    <section
      aria-label="Overall status"
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-b p-6 sm:p-8",
        tone.background,
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
          <p className="mt-1 text-sm text-slate-300">{overall.description}</p>
        </div>
      </div>

      <ul className="mt-5 flex flex-wrap gap-2" aria-label="Status summary">
        <li
          data-testid="count-total"
          className="rounded-full border border-slate-600/50 bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-200"
        >
          {counts.total} {counts.total === 1 ? "service" : "services"}
        </li>
        {(["online", "updating", "maintenance", "degraded", "offline", "unknown"] as const)
          .filter((status) => counts[status] > 0)
          .map((status) => {
            const meta = STATUS_META[status];
            return (
              <li
                key={status}
                data-testid={`count-${status}`}
                className="rounded-full border border-slate-600/50 bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-200"
              >
                <span aria-hidden="true">{meta.symbol}</span> {meta.label}: {counts[status]}
              </li>
            );
          })}
      </ul>
    </section>
  );
}