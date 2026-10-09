import type { Metadata } from "next";
import Link from "next/link";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { LoginForm } from "@/components/auth/login-form";
import { ConfigError } from "@/components/dashboard/config-error";

export const metadata: Metadata = { title: "Admin sign in" };

export default function LoginPage() {
  const configured = isSupabaseConfigured();

  if (!configured) {
    // Never advertise a sign-in form that cannot work.
    if (isDemoMode()) {
      return (
        <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-16">
          <div className="w-full rounded-2xl border border-nexus-border bg-nexus-surface p-6">
            <h1 className="text-lg font-bold text-white">Admin sign in</h1>
            <p className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              Authentication is not configured (demo mode is active). Set{" "}
              <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to sign in.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block text-sm text-cyan-400 hover:text-cyan-300"
            >
              ← Back to dashboard
            </Link>
          </div>
        </main>
      );
    }
    return <ConfigError />;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-16">
      <div className="w-full rounded-2xl border border-nexus-border bg-nexus-surface p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
          NEXUS STATUS
        </p>
        <h1 className="mt-1 text-xl font-bold text-white">Admin sign in</h1>
        <p className="mt-1 text-sm text-slate-400">
          Use an administrator account to manage services.
        </p>
        <div className="mt-5">
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">
          <Link href="/" className="text-cyan-400 hover:text-cyan-300">
            ← Back to dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}