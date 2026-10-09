/**
 * Configuration failure state. Shown in production when Supabase is not
 * configured — we deliberately refuse to show sample data in production.
 */
export function ConfigError() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-8">
        <p className="text-5xl" aria-hidden="true">
          ⚙
        </p>
        <h1 className="mt-4 text-xl font-bold text-white">
          NEXUS STATUS is not configured
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          The database connection is missing. Set{" "}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-cyan-300">
            NEXT_PUBLIC_SUPABASE_URL
          </code>{" "}
          and{" "}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-cyan-300">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>{" "}
          and redeploy.
        </p>
      </div>
    </main>
  );
}