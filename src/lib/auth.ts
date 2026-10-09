import type { SupabaseClient, User } from "@supabase/supabase-js";
import { AppError, fromDatabaseError } from "@/lib/errors";
import type { AdminIdentity } from "@/lib/types";

export interface AdminContext {
  user: { id: string; email: string | null };
  admin: AdminIdentity;
}

/** Current authenticated user, or null when not signed in / invalid session. */
export async function getSessionUser(
  client: SupabaseClient,
): Promise<User | null> {
  const { data, error } = await client.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

/**
 * Admin context if (and only if) the caller is signed in AND present in the
 * `admins` allow-list. The allow-list check is independent of the frontend.
 */
export async function getAdminContext(
  client: SupabaseClient,
): Promise<AdminContext | null> {
  const user = await getSessionUser(client);
  if (!user) return null;

  const { data, error } = await client
    .from("admins")
    .select("user_id,email,role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw fromDatabaseError(error);
  if (!data) return null;

  return {
    user: { id: user.id, email: user.email ?? null },
    admin: data as AdminIdentity,
  };
}

/**
 * Server-side authorization guard for admin API routes. Throws a safe
 * AppError: 401 when unauthenticated, 403 when authenticated but not admin.
 */
export async function requireAdmin(
  client: SupabaseClient,
): Promise<AdminContext> {
  const user = await getSessionUser(client);
  if (!user) {
    throw new AppError("unauthorized", "You must sign in to do that.");
  }

  const context = await getAdminContext(client);
  if (!context) {
    throw new AppError("forbidden", "Administrator access is required.");
  }

  return context;
}
