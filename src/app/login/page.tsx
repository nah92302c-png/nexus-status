import type { Metadata } from "next";
import Link from "next/link";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { LoginForm } from "@/components/auth/login-form";
import { ConfigError } from "@/components/dashboard/config-error";

export const metadata: Metadata = { title: "Admin sign in" };

export default function LoginPage() {
  const configured = isSupabaseConfigured();

  if (!configured) {
    if (isDemoMode()) {
      return (
        <div className="site-shell">
          <header className="site-header" role="banner">
            <Link className="brand" href="/" aria-label="STATUS">
              <h1>STATUS</h1>
            </Link>
            <div className="header-status">
              <div id="connection" className="connection connected">
                <span className="signal-dot" aria-hidden="true" />
                <span id="connection-label">Demo mode</span>
              </div>
            </div>
          </header>
          <main className="mx-auto flex min-h-[calc(100vh-112px)] w-full max-w-md flex-col items-center justify-center px-4 py-16">
            <div className="w-full rounded-2xl border border-app-border bg-app-panel p-6 shadow-sm">
              <h1 className="text-lg font-bold text-white">Admin sign in</h1>
              <p className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                Authentication is not configured (demo mode is active). Set{" "}
                <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to sign in.
              </p>
              <Link
                href="/"
                className="mt-4 inline-block text-sm text-app-accent hover:text-app-accent-hover"
              >
                ← Back to dashboard
              </Link>
            </div>
          </main>
          <footer className="site-footer">
            <span>© 2026 STATUS · Independent status dashboard</span>
            <span>Demo mode</span>
          </footer>
        </div>
      );
    }
    return <ConfigError />;
  }

  return (
    <div className="site-shell">
      <header className="site-header" role="banner">
        <Link className="brand" href="/" aria-label="STATUS">
          <h1>STATUS</h1>
        </Link>
        <div className="header-status">
          <div id="connection" className="connection connected">
            <span className="signal-dot" aria-hidden="true" />
            <span id="connection-label">Live status</span>
          </div>
        </div>
      </header>
      <main className="mx-auto flex min-h-[calc(100vh-112px)] w-full max-w-md flex-col items-center justify-center px-4 py-16">
        <div className="w-full rounded-2xl border border-app-border bg-app-panel p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent">
            STATUS
          </p>
          <h1 className="mt-1 text-xl font-bold text-white">Admin sign in</h1>
          <p className="mt-1 text-sm text-app-muted">
            Use an administrator account to manage services.
          </p>
          <div className="mt-5">
            <LoginForm />
          </div>
          <p className="mt-4 text-center text-xs text-app-muted">
            <Link href="/" className="text-app-accent hover:text-app-accent-hover">
              ← Back to dashboard
            </Link>
          </p>
        </div>
      </main>
      <footer className="site-footer">
        <span>© 2026 STATUS · Independent status dashboard</span>
        <span>Admin sign in</span>
      </footer>
    </div>
  );
}