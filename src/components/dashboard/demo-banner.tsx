/**
 * Clearly labels demo/sample data. This banner must never appear when the
 * dashboard is showing real database records — `demo` is only set by the
 * server page in demo mode.
 */
export function DemoBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
    >
      <strong className="font-semibold">Demo data — not live.</strong> No
      Supabase connection is configured, so you are seeing sample records.
      Configure the environment variables to go live.
    </div>
  );
}