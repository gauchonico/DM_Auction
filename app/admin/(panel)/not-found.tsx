import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-card">
      <h1 className="text-xl font-extrabold text-slate-900">Not found</h1>
      <p className="mt-1 text-sm text-slate-600">This item may have been deleted.</p>
      <Link href="/admin" className="mt-5 inline-flex min-h-11 items-center rounded-md bg-brand px-5 text-sm font-bold text-white">
        Back to dashboard
      </Link>
    </div>
  );
}
