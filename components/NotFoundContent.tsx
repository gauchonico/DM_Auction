import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFoundContent() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <SearchX className="h-12 w-12 text-slate-400" aria-hidden />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Page not found</h1>
      <p className="mt-2 text-slate-600">
        This listing may have been withdrawn, or the link is incorrect. If you have a reference number from a printed
        notice, you can verify it.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/search" className="inline-flex min-h-11 items-center rounded-xl bg-brand px-5 font-semibold text-white">
          Browse auctions
        </Link>
        <Link href="/verify" className="inline-flex min-h-11 items-center rounded-xl border-2 border-brand px-5 font-semibold text-brand">
          Verify a notice
        </Link>
      </div>
    </div>
  );
}
