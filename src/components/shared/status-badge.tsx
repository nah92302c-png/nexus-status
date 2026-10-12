import { STATUS_META, type ServiceStatus, type StatusTone } from "@/lib/types";
import { cn } from "@/lib/cn";

const TONE_CLASSES: Record<StatusTone, string> = {
  ok: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  info: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  critical: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  neutral: "border-slate-500/40 bg-slate-500/10 text-slate-300",
};

const SYMBOL_CLASSES: Record<StatusTone, string> = {
  ok: "text-emerald-400",
  info: "text-sky-400",
  warning: "text-amber-400",
  critical: "text-rose-400",
  neutral: "text-slate-400",
};

interface StatusBadgeProps {
  status: ServiceStatus;
  size?: "sm" | "md";
}

/**
 * Status indicator that is never colour-only: it always renders a non-colour
 * symbol plus the status label text, so it is legible without colour or vision.
 */
export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const meta = STATUS_META[status];
  return (
    <span
      role="status"
      data-tone={meta.tone}
      title={meta.description}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium tracking-wide",
        TONE_CLASSES[meta.tone],
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
      )}
    >
      <span aria-hidden="true" className={cn("leading-none", SYMBOL_CLASSES[meta.tone])}>
        {meta.symbol}
      </span>
      <span>{meta.label}</span>
    </span>
  );
}