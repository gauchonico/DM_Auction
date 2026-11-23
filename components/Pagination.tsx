import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { searchHref, type SearchFilters } from "@/lib/search-params";

export default function Pagination({ filters, page, pageCount }: { filters: SearchFilters; page: number; pageCount: number }) {
  if (pageCount <= 1) return null;

  const linkClass =
    "inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50";
  const disabledClass =
    "inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-400";

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-between gap-2">
      {page > 1 ? (
        <Link href={searchHref({ ...filters, page: page - 1 })} className={linkClass} rel="prev">
          <ChevronLeft className="h-4 w-4" aria-hidden /> Previous
        </Link>
      ) : (
        <span className={disabledClass} aria-disabled>
          <ChevronLeft className="h-4 w-4" aria-hidden /> Previous
        </span>
      )}
      <span className="text-sm text-slate-600">
        Page <strong>{page}</strong> of {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={searchHref({ ...filters, page: page + 1 })} className={linkClass} rel="next">
          Next <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <span className={disabledClass} aria-disabled>
          Next <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      )}
    </nav>
  );
}
