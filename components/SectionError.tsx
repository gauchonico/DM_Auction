import { AlertTriangle } from "lucide-react";

export default function SectionError({ message }: { message: string }) {
  return (
    <div role="alert" className="flex flex-wrap items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <p className="flex-1">{message}</p>
      {/* Plain link reload: works without JavaScript. */}
      <a href="" className="inline-flex min-h-9 items-center rounded-xl bg-white px-3 font-medium text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100">
        Try again
      </a>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <p className="text-base font-semibold text-slate-800">{title}</p>
      {children && <div className="mt-2 text-sm text-slate-600">{children}</div>}
    </div>
  );
}

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <div className="aspect-[4/3] bg-slate-200" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 rounded bg-slate-200" />
            <div className="h-4 w-5/6 rounded bg-slate-200" />
            <div className="h-4 w-1/2 rounded bg-slate-200" />
            <div className="h-10 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
