import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
        STATUS
      </p>
      <h1 className="mt-2 text-3xl font-bold text-white">Page not found</h1>
      <p className="mt-2 text-sm text-slate-400">
        The page you were looking for does not exist or has moved.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-cyan-400"
      >
        Back to dashboard
      </Link>
    </main>
  );
}