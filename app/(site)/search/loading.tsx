import { CardGridSkeleton } from "@/components/SectionError";

export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5 h-8 w-48 animate-pulse rounded bg-slate-200" />
      <CardGridSkeleton count={6} />
    </div>
  );
}
