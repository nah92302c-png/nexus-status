/**
 * Environment configuration with explicit, safe failure modes.
 *
 * - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are the only
 *   values that may reach the browser (the anon key is designed to be public
 *   and is protected by Row Level Security).
 * - `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be imported into
 *   client code or prefixed with NEXT_PUBLIC_.
 */

export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicConfig() !== null;
}

/**
 * Demo mode renders realistic sample data purely for local UI development and
 * automated UI tests. It is *never* active in production, so a misconfigured
 * production deployment shows a configuration error instead of fake data.
 */
export function isDemoMode(): boolean {
  if (isSupabaseConfigured()) return false;
  if (process.env.NEXT_PUBLIC_FORCE_DEMO === "true") return true;
  return process.env.NODE_ENV !== "production";
}

export function getSiteUrl(): string {
  return clean(process.env.NEXT_PUBLIC_SITE_URL) ?? "http://localhost:3000";
}

export function getPollIntervalMs(): number {
  const raw = Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS ?? "30000");
  if (!Number.isFinite(raw) || raw < 5000) return 30000;
  return Math.floor(raw);
}
