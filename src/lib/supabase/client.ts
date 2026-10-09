import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/env";

let cached: SupabaseClient | null = null;

/**
 * Browser Supabase client (anon key only). Returns null when Supabase is not
 * configured so callers can fall back to demo mode gracefully.
 *
 * The anon key is public by design; Row Level Security is what protects data.
 */
export function getBrowserSupabase(): SupabaseClient | null {
  const config = getSupabasePublicConfig();
  if (!config) return null;
  if (!cached) {
    cached = createBrowserClient(config.url, config.anonKey);
  }
  return cached;
}
