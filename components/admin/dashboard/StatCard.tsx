import Link from "next/link";
import { TrendingDown, TrendingUp } from "lucide-react";
import { IconChip, type Tone } from "../ui";

export interface Trend {
  current: number;
  previous: number;
  label: string; // e.g. "new listings vs prev. 30 days"
}

function trendText(t: Trend): { text: string; up: boolean | null } {
  // No baseline: a percentage would be meaningless, so show the absolute change.
  if (t.previous === 0) return { text: t.current > 0 ? `+${t.current}` : "No change", up: t.current > 0 ? true : null };
  const pct = ((t.current - t.previous) / t.previous) * 100;
  return { text: `${Math.abs(pct).toFixed(pct % 1 === 0 ? 0 : 1)}%`, up: pct === 0 ? null : pct > 0 };
}

/** Brightly-style KPI card: label, large tabular number, and a trend or caption line. */
export default function StatCard({
  label,
  value,
  href,
  icon,
  tone,
  trend,
  caption,
}: {
  label: string;
  value: number;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: Tone;
  trend?: Trend;
  caption?: string;
}) {
  const t = trend ? trendText(trend) : null;
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:p-5 transition hover:-translate-y-0.5 hover:border-brand-100 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-medium leading-snug text-slate-500 sm:text-sm">{label}</span>
        <IconChip icon={icon} tone={tone} size="sm" />
      </div>
      <span className="mt-2 text-[26px] font-semibold leading-none sm:text-[32px] tracking-tight tabular-nums text-slate-900">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="mt-3 flex flex-wrap items-center gap-x-1.5 font-compact text-xs sm:text-[13px]">
        {t && trend ? (
          <>
            <span
              className={`inline-flex items-center gap-0.5 font-semibold tabular-nums ${
                t.up === null ? "text-slate-500" : t.up ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {t.up === true && <TrendingUp className="h-3.5 w-3.5" aria-label="up" />}
              {t.up === false && <TrendingDown className="h-3.5 w-3.5" aria-label="down" />}
              {t.text}
            </span>
            <span className="text-slate-500">{trend.label}</span>
          </>
        ) : (
          <span className="text-slate-500">{caption}</span>
        )}
      </span>
    </Link>
  );
}
