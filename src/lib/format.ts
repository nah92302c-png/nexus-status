/**
 * Format an ISO timestamp deterministically in UTC.
 *
 * Intentionally avoids `Intl`/`toLocaleString` so server and client renders
 * are identical and never trigger a hydration mismatch. Output example:
 *   "2026-10-09 14:03 UTC"
 */
export function formatUtc(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";

  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` +
    ` ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`
  );
}

/** Short date+time in UTC, e.g. "Oct 09, 14:03 UTC". */
export function formatUtcShort(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${months[date.getUTCMonth()]} ${pad(date.getUTCDate())}, ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`;
}
