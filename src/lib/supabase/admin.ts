import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";

/**
 * Service-role client. It bypasses Row Level Security, so it is intentionally
 * confined to trusted server-side scripts (seeding, creating the first admin)
 * and must NEVER be imported from client code.
 *
 * The key is read from SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix), so
 * it is never bundled into the browser.
 */
export function getServiceRoleClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey) {
    throw new AppError(
      "config_error",
      "SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required for server scripts.",
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
