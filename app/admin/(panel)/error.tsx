"use client";

import { useEffect } from "react";
import { RefreshCw, ServerCrash } from "lucide-react";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-card">
      <ServerCrash className="mx-auto h-10 w-10 text-slate-400" aria-hidden />
      <h1 className="mt-3 text-xl font-extrabold text-slate-900">Something went wrong</h1>
      <p className="mt-1 text-sm text-slate-600">The page couldn&apos;t load — often a brief connection problem with the database.</p>
      {error.digest && <p className="mt-2 text-xs text-slate-400">Error reference: {error.digest}</p>}
      <button type="button" onClick={reset} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-brand px-5 text-sm font-bold text-white">
        <RefreshCw className="h-4 w-4" aria-hidden /> Try again
      </button>
    </div>
  );
}
