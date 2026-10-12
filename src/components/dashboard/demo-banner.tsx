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
      className="notice"
      style={{ borderColor: "#e4b96b50", background: "#231e13", color: "#ebc98d" }}
    >
      <strong className="font-semibold">Demo data — not live.</strong> No
      Supabase connection is configured, so you are seeing sample records.
      Configure the environment variables to go live.
    </div>
  );
}