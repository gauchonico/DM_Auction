import { Building2, CalendarClock, Gavel, MapPinned } from "lucide-react";
import type { HomeStats } from "@/lib/queries";

export default function TrustStrip({ stats }: { stats: HomeStats }) {
  const items = [
    { icon: Gavel, value: stats.liveAuctions, label: "Live auctions", tone: "bg-brand-50 text-brand" },
    { icon: Building2, value: stats.verifiedAdvertisers, label: "Verified advertisers", tone: "bg-violet-50 text-violet-700" },
    { icon: MapPinned, value: stats.districts, label: "Districts covered", tone: "bg-emerald-50 text-emerald-700" },
    { icon: CalendarClock, value: stats.closingThisWeek, label: "Auctions this week", tone: "bg-amber-50 text-amber-700" },
  ];
  return (
    <section aria-label="Marketplace at a glance" className="mx-auto max-w-7xl px-4 sm:px-6">
      <ul className="grid grid-cols-2 gap-3 rounded-3xl border border-slate-100 bg-white p-3 shadow-[0_1px_3px_rgba(16,24,40,0.06)] sm:p-4 lg:grid-cols-4 lg:divide-x lg:divide-slate-100 lg:gap-0">
        {items.map(({ icon: Icon, value, label, tone }) => (
          <li key={label} className="flex items-center gap-3 rounded-2xl p-2 lg:justify-center lg:rounded-none">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tone}`}>
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block text-xl font-semibold tabular-nums tracking-tight text-slate-900">{value}</span>
              <span className="text-xs text-slate-500 sm:text-sm">{label}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
