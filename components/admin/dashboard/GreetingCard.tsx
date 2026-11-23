import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import type { StaffIdentity } from "@/lib/auth";
import WeeklyAuctionsChart, { type WeekBar } from "./WeeklyAuctionsChart";

function greeting(now: Date): string {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Kampala", hour: "numeric", hour12: false }).format(now));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
}

/**
 * "Statistic" card from the Coursue reference: avatar inside a progress ring
 * (share of upcoming auctions that are live), a time-aware greeting, and the weekly chart.
 */
export default function GreetingCard({
  staff,
  liveCount,
  upcomingCount,
  pendingCount,
  weeks,
}: {
  staff: StaffIdentity;
  liveCount: number;
  upcomingCount: number;
  pendingCount: number;
  weeks: WeekBar[];
}) {
  const pct = upcomingCount ? Math.round((liveCount / upcomingCount) * 100) : 0;
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const first = staff.name.split(" ")[0];

  return (
    <section aria-labelledby="greeting-title" className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-slate-900">Statistic</h2>
        <Link href="/admin/listings" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600" aria-label="View all auctions">
          <MoreHorizontal className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="mt-4 flex flex-col items-center text-center">
        <div className="relative h-32 w-32">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
            <circle cx="60" cy="60" r={r} fill="none" stroke="#DCE8F6" strokeWidth="6" />
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke="#023E8A"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
            />
          </svg>
          <span className="absolute inset-3 grid place-items-center rounded-full bg-gradient-to-br from-brand-50 to-sky-100 text-3xl font-bold text-brand">
            {initials(staff.name)}
          </span>
          <span className="absolute -right-1 top-2 rounded-full bg-brand px-2 py-0.5 font-compact text-xs font-semibold tabular-nums text-white shadow ring-2 ring-white">
            {pct}%
          </span>
        </div>

        <p id="greeting-title" className="mt-4 text-lg font-semibold text-slate-900">
          {greeting(new Date())}, {first} <span aria-hidden>👋</span>
        </p>
        <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-slate-500">
          <strong className="font-semibold text-slate-700">{pct}%</strong> of upcoming auctions are live.{" "}
          {pendingCount > 0 ? (
            <>
              <Link href="/admin/listings?status=PENDING" className="font-semibold text-brand hover:underline">
                {pendingCount} waiting for review
              </Link>
              .
            </>
          ) : (
            "Nothing waiting for review."
          )}
        </p>
      </div>

      <div className="mt-5">
        <WeeklyAuctionsChart weeks={weeks} />
      </div>
    </section>
  );
}
