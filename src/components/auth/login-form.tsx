"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";

/**
 * Sign-in form. Authentication runs against Supabase Auth directly from the
 * browser; server-side authorization (the `admins` allow-list) is enforced
 * separately by `/admin` and the admin API routes.
 */
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Authentication is not configured on this deployment.");
      return;
    }

    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);

    if (signInError) {
      setError("Sign-in failed. Check your email and password.");
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-slate-300">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-lg border border-nexus-border bg-nexus-surface px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-nexus-accent focus:outline-none focus:ring-2 focus:ring-nexus-accent/30"
        />
      </div>

      <div>
        <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-slate-300">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-nexus-border bg-nexus-surface px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-nexus-accent focus:outline-none focus:ring-2 focus:ring-nexus-accent/30"
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}