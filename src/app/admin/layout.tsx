import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { getServerSupabase } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AdminNav } from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";

interface LayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: LayoutProps) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const client = await getServerSupabase();
  const context = await getAdminContext(client);
  if (!context) {
    redirect("/login");
  }

  return (
    <div className="site-shell">
      <header className="site-header" role="banner">
        <div className="brand" style={{ display: "flex", alignItems: "center", gap: "13px" }}>
          <Link href="/" className="brand" aria-label="STATUS">
            <h1>STATUS</h1>
          </Link>
          <AdminNav />
        </div>
        <div className="header-status">
          <div id="connection" className="connection connected">
            <span className="signal-dot" aria-hidden="true" />
            <span id="connection-label">Live status</span>
          </div>
          <div className="check-info">
            <span className="hidden text-xs text-slate-500 sm:inline">
              {context.user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      <footer className="site-footer">
        <span>© 2026 STATUS · Independent status dashboard</span>
        <span>Admin panel</span>
      </footer>
    </div>
  );
}