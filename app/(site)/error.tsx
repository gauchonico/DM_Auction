"use client";

import { useEffect } from "react";
import { RefreshCw, ServerCrash } from "lucide-react";

export default function GlobalRouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <ServerCrash className="h-12 w-12 text-slate-400" aria-hidden />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Something went wrong</h1>
      <p className="mt-2 text-slate-600">
        We couldn&apos;t load this page. Please check your connection and try again.
      </p>
      {error.digest && <p className="mt-2 text-xs text-slate-400">Error reference: {error.digest}</p>}
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 font-semibold text-white"
      >
        <RefreshCw className="h-4 w-4" aria-hidden /> Try again
      </button>
    </div>
  );
}
