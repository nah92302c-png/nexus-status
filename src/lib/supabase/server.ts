import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/env";
import { AppError } from "@/lib/errors";

/**
 * Server-side Supabase client bound to the request cookies. Used in Server
 * Components, Server Actions and Route Handlers. RLS applies as the signed-in
 * user (or anon), so this client can never exceed the user's privileges.
 */
export async function getServerSupabase(): Promise<SupabaseClient> {
  const config = getSupabasePublicConfig();
  if (!config) {
    throw new AppError(
      "config_error",
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render, where cookies are
          // read-only. Session refresh is handled by `proxy.ts` and by
          // Route Handlers/Server Actions, so this is safe to ignore.
        }
      },
    },
  });
}
