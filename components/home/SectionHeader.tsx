import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function SectionHeader({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View all",
  id,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  id?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8">
      <div className="max-w-2xl">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">{eyebrow}</p>}
        <h2 id={id} className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]">
          {title}
        </h2>
        {description && <p className="mt-2 text-[15px] leading-relaxed text-slate-500">{description}</p>}
      </div>
      {href && (
        <Link href={href} className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-1 text-sm font-medium text-brand hover:gap-2.5 hover:underline">
          {linkLabel} <ArrowRight className="h-4 w-4 transition-all" aria-hidden />
        </Link>
      )}
    </div>
  );
}
