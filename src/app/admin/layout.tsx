import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { getServerSupabase } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AdminNav } from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";

/**
 * Server-side authorization for every /admin page. Users who are not signed in
 * or not on the `admins` allow-list are sent to the login page before any admin
 * UI or data is rendered. This complements the checks in every admin API route.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const client = await getServerSupabase();
  const context = await getAdminContext(client);
  if (!context) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-app-border bg-app-bg/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-[#f2f2f3] text-xs font-black text-[#111]">
                S
              </span>
              <span className="text-sm font-extrabold tracking-[0.13em] text-white">
                STATUS
              </span>
            </Link>
            <AdminNav />
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-500 sm:inline">
              {context.user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}