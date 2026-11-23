import Link from "next/link";
import {
  ArrowRight,
  Car,
  ChevronRight,
  Factory,
  FileClock,
  Gavel,
  Home,
  Inbox,
  CalendarClock,
  Package,
  Plus,
} from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime, kampalaStartOfToday } from "@/lib/format";
import GreetingCard from "@/components/admin/dashboard/GreetingCard";
import StatCard from "@/components/admin/dashboard/StatCard";
import type { WeekBar } from "@/components/admin/dashboard/WeeklyAuctionsChart";
import { Avatar, Card, EmptyRow, IconChip, Notice, type Tone, buttonSmall, tableWrap, td, th, theadRow } from "@/components/admin/ui";

export const metadata = { title: "Dashboard" };

const DAY = 24 * 60 * 60 * 1000;
const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  "real-estate": Home,
  vehicles: Car,
  machinery: Factory,
};
const CATEGORY_TONES: Tone[] = ["blue", "violet", "amber", "emerald", "sky", "rose"]; // fixed order, never cycled by rank
// Written out in full so Tailwind generates each class.
const BAR_TONE: Record<Tone, string> = {
  blue: "bg-brand",
  sky: "bg-sky-600",
  violet: "bg-violet-600",
  amber: "bg-amber-500",
  emerald: "bg-emerald-600",
  rose: "bg-rose-600",
  slate: "bg-slate-500",
};

/** Monday 00:00 Kampala time of the current week, as a UTC Date. */
function kampalaWeekStart(now = new Date()): Date {
  const today = kampalaStartOfToday(now);
  const kampalaDow = new Date(today.getTime() + 3 * 60 * 60 * 1000).getUTCDay(); // 0 = Sunday
  return new Date(today.getTime() - ((kampalaDow + 6) % 7) * DAY);
}

const dayMonth = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Kampala", day: "numeric", month: "short" });

function timeAgo(date: Date): string {
  const s = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`;
  return formatDate(date);
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const staff = await requireStaff();
  const isAdmin = staff.role === "ADMIN";
  const params = await searchParams;

  const now = new Date();
  const today = kampalaStartOfToday(now);
  const weekStart = kampalaWeekStart(now);
  const weekEnd = new Date(weekStart.getTime() + 7 * DAY);
  const chartEnd = new Date(weekStart.getTime() + 6 * 7 * DAY);
  const d30 = new Date(now.getTime() - 30 * DAY);
  const d60 = new Date(now.getTime() - 60 * DAY);

  const [
    live,
    pending,
    thisWeek,
    nextAuction,
    openEnquiries,
    listingsLast30,
    listingsPrev30,
    enquiriesLast30,
    enquiriesPrev30,
    oldestPending,
    categories,
    liveByCategory,
    pendingList,
    weekListings,
    activity,
  ] = await Promise.all([
    prisma.listing.count({ where: { status: "PUBLISHED", saleDate: { gte: today } } }),
    prisma.listing.count({ where: { status: "PENDING" } }),
    prisma.listing.count({ where: { status: "PUBLISHED", saleDate: { gte: today, lt: weekEnd } } }),
    prisma.listing.findFirst({ where: { status: "PUBLISHED", saleDate: { gte: now } }, orderBy: { saleDate: "asc" }, select: { saleDate: true } }),
    prisma.advertiserEnquiry.count({ where: { handled: false } }),
    prisma.listing.count({ where: { createdAt: { gte: d30 } } }),
    prisma.listing.count({ where: { createdAt: { gte: d60, lt: d30 } } }),
    prisma.advertiserEnquiry.count({ where: { createdAt: { gte: d30 } } }),
    prisma.advertiserEnquiry.count({ where: { createdAt: { gte: d60, lt: d30 } } }),
    prisma.listing.findFirst({ where: { status: "PENDING" }, orderBy: { updatedAt: "asc" }, select: { updatedAt: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true, _count: { select: { listings: true } } } }),
    prisma.listing.groupBy({ by: ["categoryId"], where: { status: "PUBLISHED", saleDate: { gte: today } }, _count: { _all: true } }),
    prisma.listing.findMany({
      where: { status: "PENDING" },
      orderBy: { updatedAt: "asc" },
      take: 6,
      select: {
        id: true,
        referenceId: true,
        title: true,
        saleDate: true,
        updatedAt: true,
        status: true,
        client: { select: { name: true } },
        category: { select: { name: true } },
      },
    }),
    prisma.listing.findMany({
      where: { status: { in: ["PUBLISHED", "PENDING"] }, saleDate: { gte: weekStart, lt: chartEnd } },
      select: { saleDate: true },
    }),
    prisma.auditLog.findMany({
      where: isAdmin ? { action: { not: "auth.login" } } : { actorId: staff.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, createdAt: true, actorEmail: true, summary: true, entityLabel: true },
    }),
  ]);

  const liveMap = new Map(liveByCategory.map((c) => [c.categoryId, c._count._all]));
  const weeks: WeekBar[] = Array.from({ length: 6 }, (_, i) => {
    const start = new Date(weekStart.getTime() + i * 7 * DAY);
    const end = new Date(start.getTime() + 7 * DAY);
    return {
      key: start.toISOString(),
      label: dayMonth.format(start),
      range: `${dayMonth.format(start)} – ${dayMonth.format(new Date(end.getTime() - DAY))}`,
      count: weekListings.filter((l) => l.saleDate >= start && l.saleDate < end).length,
      current: i === 0,
    };
  });
  const oldestDays = oldestPending ? Math.floor((now.getTime() - oldestPending.updatedAt.getTime()) / DAY) : 0;

  return (
    <>
      <Notice code={params.error ?? params.notice} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ---------------- main column ---------------- */}
        <div className="min-w-0 space-y-6">
          {/* Hero banner */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand via-[#0353A4] to-[#0077B6] p-6 text-white shadow-card sm:p-8">
            <svg className="pointer-events-none absolute -right-6 -top-6 h-48 w-48 text-white/10" viewBox="0 0 100 100" aria-hidden>
              <path d="M50 0 C53 40 60 47 100 50 C60 53 53 60 50 100 C47 60 40 53 0 50 C40 47 47 40 50 0Z" fill="currentColor" />
            </svg>
            <svg className="pointer-events-none absolute bottom-4 right-40 hidden h-16 w-16 text-white/15 sm:block" viewBox="0 0 100 100" aria-hidden>
              <path d="M50 0 C53 40 60 47 100 50 C60 53 53 60 50 100 C47 60 40 53 0 50 C40 47 47 40 50 0Z" fill="currentColor" />
            </svg>
            <span className="pointer-events-none absolute -bottom-16 right-10 h-40 w-40 rounded-full bg-sky-300/20 blur-2xl" aria-hidden />

            <p className="font-compact text-xs font-semibold uppercase tracking-[0.14em] text-sky-200">Nation Media Group · Auction desk</p>
            <h1 className="mt-2 max-w-lg text-2xl font-semibold leading-tight tracking-tight sm:text-[28px]">
              Publish verified auction notices with confidence
            </h1>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/admin/listings/new" className="inline-flex min-h-11 items-center gap-3 rounded-full bg-slate-950 py-1.5 pl-5 pr-1.5 text-sm font-semibold text-white hover:bg-black">
                New auction
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-slate-950">
                  <Plus className="h-4 w-4" aria-hidden />
                </span>
              </Link>
              {pending > 0 && (
                <Link href="/admin/listings?status=PENDING" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-5 text-sm font-semibold text-white ring-1 ring-white/25 hover:bg-white/20">
                  Review {pending} pending <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              )}
            </div>
          </section>

          {/* KPI cards */}
          <section aria-label="Key figures" className="grid grid-cols-2 gap-3 sm:gap-4 2xl:grid-cols-4">
            <StatCard label="Live auctions" value={live} href="/admin/listings?status=PUBLISHED" icon={Gavel} tone="blue"
              trend={{ current: listingsLast30, previous: listingsPrev30, label: "new listings · 30 days" }} />
            <StatCard label="Awaiting review" value={pending} href="/admin/listings?status=PENDING" icon={FileClock} tone="amber"
              caption={pending ? `Oldest waiting ${oldestDays === 0 ? "since today" : `${oldestDays} day${oldestDays === 1 ? "" : "s"}`}` : "All caught up"} />
            <StatCard label="Auctions this week" value={thisWeek} href="/admin/listings?status=PUBLISHED" icon={CalendarClock} tone="violet"
              caption={nextAuction ? `Next: ${formatDate(nextAuction.saleDate)}, ${formatTime(nextAuction.saleDate)}` : "None scheduled"} />
            <StatCard label="Open enquiries" value={openEnquiries} href="/admin/enquiries" icon={Inbox} tone="rose"
              trend={{ current: enquiriesLast30, previous: enquiriesPrev30, label: "received · 30 days" }} />
          </section>

          {/* Category cards */}
          <section aria-label="Live auctions by category" className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            {categories.map((c, i) => {
              const liveCount = liveMap.get(c.id) ?? 0;
              const tone = CATEGORY_TONES[i % CATEGORY_TONES.length];
              const pct = c._count.listings ? Math.round((liveCount / c._count.listings) * 100) : 0;
              return (
                <Link key={c.id} href={`/admin/listings?category=${c.slug}`} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card hover:border-brand-100">
                  <div className="flex items-center gap-3">
                    <IconChip icon={CATEGORY_ICON[c.slug] ?? Package} tone={tone} />
                    <div className="min-w-0">
                      <p className="font-compact text-xs tabular-nums text-slate-500">{liveCount}/{c._count.listings} live</p>
                      <p className="truncate text-sm font-semibold text-slate-900">{c.name}</p>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${pct}% of ${c.name} listings are live`}>
                    <div className={`h-full rounded-full ${BAR_TONE[tone]}`} style={{ width: `${pct}%` }} />
                  </div>
                </Link>
              );
            })}
          </section>

          {/* Awaiting review table */}
          <section aria-labelledby="review-heading">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="review-heading" className="text-[17px] font-semibold text-slate-900">Awaiting review</h2>
              <Link href="/admin/listings?status=PENDING" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
                See all <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className={tableWrap}>
              <table className="w-full min-w-[600px]">
                <thead className={theadRow}>
                  <tr>
                    <th className={th}>Listing</th>
                    <th className={th}>Category</th>
                    <th className={th}>Auction</th>
                    <th className={th}>Waiting</th>
                    <th className={`${th} text-right`}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingList.length === 0 && <EmptyRow colSpan={5}>Nothing waiting for review — nice work.</EmptyRow>}
                  {pendingList.map((l) => {
                    const waitingDays = Math.floor((now.getTime() - l.updatedAt.getTime()) / DAY);
                    return (
                      <tr key={l.id} className="hover:bg-slate-50/60">
                        <td className={`${td} w-full max-w-0`}>
                          <div className="flex items-center gap-3">
                            <Avatar name={l.client.name} />
                            <div className="min-w-0">
                              <Link href={`/admin/listings/${l.id}`} className="line-clamp-1 font-medium text-slate-900 hover:text-brand">{l.title}</Link>
                              <p className="truncate text-xs text-slate-500">
                                <span className="font-mono">{l.referenceId}</span> · {l.client.name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className={td}><span className="whitespace-nowrap rounded-md bg-violet-50 px-2 py-0.5 font-compact text-xs font-semibold text-violet-700">{l.category.name}</span></td>
                        <td className={`${td} whitespace-nowrap`}>
                          {formatDate(l.saleDate)}
                          <span className="block text-xs text-slate-500">{formatTime(l.saleDate)}</span>
                        </td>
                        <td className={`${td} whitespace-nowrap`}>
                          {waitingDays >= 2 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 font-compact text-xs font-semibold text-amber-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden /> {waitingDays} days
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-compact text-xs font-semibold text-emerald-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden /> {waitingDays === 0 ? "Today" : "1 day"}
                            </span>
                          )}
                        </td>
                        <td className={`${td} text-right`}>
                          <Link href={`/admin/listings/${l.id}`} className={buttonSmall}>{isAdmin ? "Review" : "Open"}</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* ---------------- right column ---------------- */}
        <aside className="order-first space-y-6 xl:order-none">
          <GreetingCard staff={staff} liveCount={live} upcomingCount={live + pending} pendingCount={pending} weeks={weeks} />

          <Card title={isAdmin ? "Recent activity" : "Your recent activity"}>
            {activity.length === 0 ? (
              <p className="text-sm text-slate-500">No activity recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 rounded-xl bg-slate-50/80 p-3">
                    <Avatar name={a.actorEmail} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[13px] font-medium leading-snug text-slate-800">{a.summary}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {a.entityLabel && <span className="font-mono">{a.entityLabel}</span>}
                        {a.entityLabel && " · "}
                        {timeAgo(a.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {isAdmin && (
              <Link href="/admin/audit" className="mt-3 flex min-h-11 items-center justify-center rounded-xl bg-brand-50 text-sm font-semibold text-brand hover:bg-brand-100">
                See all
              </Link>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
