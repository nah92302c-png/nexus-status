"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = getBrowserSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={signingOut}
      className="rounded-lg border border-app-border bg-app-surface px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-rose-500/50 hover:text-rose-300 disabled:opacity-50"
    >
      {signingOut ? "Signing out…" : "Sign out"}
    </button>
  );
}