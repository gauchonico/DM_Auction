import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ChevronLeft, ChevronRight, Plus, Search, Star } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime, formatUGX, kampalaStartOfToday } from "@/lib/format";
import { oneOf } from "@/lib/admin/form";
import { ConfirmButton } from "@/components/admin/buttons";
import { Avatar, EmptyRow, Notice, PageHeader, StatusPill, buttonPrimary, buttonSecondary, buttonSmall, inputClass, tableWrap, td, th, theadRow } from "@/components/admin/ui";
import { expirePastListings, setListingStatus } from "./actions";

export const metadata = { title: "Auctions" };

const PER_PAGE = 25;
const STATUSES = ["PENDING", "PUBLISHED", "EXPIRED"] as const;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim().slice(0, 100) ?? "";

export default async function AdminListingsPage({ searchParams }: PageProps) {
  const staff = await requireStaff();
  const params = await searchParams;
  const status = oneOf(first(params.status), STATUSES);
  const q = first(params.q);
  const clientId = first(params.client);
  const category = first(params.category);
  const past = first(params.past) === "1";
  const page = Math.max(1, Math.min(1000, Number(first(params.page)) || 1));

  const where: Prisma.ListingWhereInput = {
    ...(status ? { status } : {}),
    ...(clientId ? { clientId } : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(past ? { saleDate: { lt: kampalaStartOfToday() } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { referenceId: { contains: q, mode: "insensitive" } },
            { district: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, listings, clients, counts, categories] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        referenceId: true,
        title: true,
        district: true,
        saleDate: true,
        status: true,
        isFeatured: true,
        reservePrice: true,
        client: { select: { name: true } },
        _count: { select: { media: true } },
      },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.listing.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
  ]);

  const countFor = (s: (typeof STATUSES)[number]) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const href = (overrides: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    const merged = { status: status ?? undefined, q: q || undefined, client: clientId || undefined, category: category || undefined, past: past ? "1" : undefined, page: undefined, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== "") sp.set(k, String(v));
    const s = sp.toString();
    return s ? `/admin/listings?${s}` : "/admin/listings";
  };
  const back = href({ page: page > 1 ? page : undefined });

  const tabs = [
    { label: "All", value: undefined, count: countFor("PENDING") + countFor("PUBLISHED") + countFor("EXPIRED") },
    { label: "Pending", value: "PENDING", count: countFor("PENDING") },
    { label: "Published", value: "PUBLISHED", count: countFor("PUBLISHED") },
    { label: "Expired", value: "EXPIRED", count: countFor("EXPIRED") },
  ];

  return (
    <>
      <PageHeader
        title="Auctions"
        description="All listings, including drafts awaiting review."
        actions={
          <Link href="/admin/listings/new" className={buttonPrimary}>
            <Plus className="h-4 w-4" aria-hidden /> New auction
          </Link>
        }
      />
      <Notice code={params.error ?? params.notice} />

      <nav aria-label="Filter by status" className="mb-4 inline-flex flex-wrap gap-1 rounded-2xl border border-slate-100 bg-white p-1 shadow-card">
        {tabs.map((t) => {
          const active = (status ?? undefined) === t.value && !past;
          return (
            <Link
              key={t.label}
              href={href({ status: t.value, past: undefined })}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-9 items-center gap-2 rounded-xl px-3.5 text-sm font-medium transition-colors ${active ? "bg-brand text-white shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 font-compact text-xs font-semibold tabular-nums ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>{t.count}</span>
            </Link>
          );
        })}
      </nav>

      <form method="get" className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_14rem_14rem_auto]">
        {status && <input type="hidden" name="status" value={status} />}
        {past && <input type="hidden" name="past" value="1" />}
        <label htmlFor="q" className="sr-only">Search</label>
        <input id="q" name="q" defaultValue={q} placeholder="Search title, reference or district" className={inputClass} />
        <label htmlFor="category" className="sr-only">Category</label>
        <select id="category" name="category" defaultValue={category} className={inputClass}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <label htmlFor="client" className="sr-only">Client</label>
        <select id="client" name="client" defaultValue={clientId} className={inputClass}>
          <option value="">All clients</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="submit" className={buttonSecondary}><Search className="h-4 w-4" aria-hidden /> Filter</button>
      </form>

      {past && staff.role === "ADMIN" && total > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Showing listings whose auction date has passed.
          <form action={expirePastListings}>
            <ConfirmButton className={buttonSecondary} message="Mark every published auction with a past sale date as expired?">
              Mark all past published auctions as expired
            </ConfirmButton>
          </form>
        </div>
      )}

      <div className={tableWrap}>
        <table className="w-full min-w-[640px]">
          <thead className={theadRow}>
            <tr>
              <th className={th}>Listing</th>
              <th className={th}>Auction</th>
              <th className={th}>Reserve</th>
              <th className={th}>Status</th>
              <th className={`${th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {listings.length === 0 && <EmptyRow colSpan={5}>No listings match these filters.</EmptyRow>}
            {listings.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50/60">
                <td className={`${td} w-full max-w-0`}>
                  <div className="flex items-center gap-3">
                    <Avatar name={l.client.name} />
                    <div className="min-w-0">
                      <Link href={`/admin/listings/${l.id}`} className="line-clamp-1 font-medium text-slate-900 hover:text-brand">
                        {l.isFeatured && <Star className="mr-1 inline h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-label="Featured" />}
                        {l.title}
                      </Link>
                      <p className="truncate text-xs text-slate-500">
                        <span className="font-mono">{l.referenceId}</span> · {l.client.name} · {l.district} · {l._count.media} file{l._count.media === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className={`${td} whitespace-nowrap`}>{formatDate(l.saleDate)}<span className="block text-xs text-slate-500">{formatTime(l.saleDate)}</span></td>
                <td className={`${td} whitespace-nowrap`}>{formatUGX(l.reservePrice, "—")}</td>
                <td className={td}><StatusPill status={l.status} /></td>
                <td className={`${td} text-right`}>
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/listings/${l.id}`} className={buttonSmall}>Edit</Link>
                    {staff.role === "ADMIN" && l.status === "PENDING" && (
                      <form action={setListingStatus}>
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="status" value="PUBLISHED" />
                        <input type="hidden" name="back" value={back} />
                        <button type="submit" className={`${buttonSmall} border-emerald-300 text-emerald-800`}>Publish</button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between">
          {page > 1 ? <Link href={href({ page: page - 1 })} className={buttonSecondary}><ChevronLeft className="h-4 w-4" aria-hidden /> Previous</Link> : <span />}
          <span className="text-sm text-slate-600">Page {page} of {pageCount} · {total} listings</span>
          {page < pageCount ? <Link href={href({ page: page + 1 })} className={buttonSecondary}>Next <ChevronRight className="h-4 w-4" aria-hidden /></Link> : <span />}
        </nav>
      )}
    </>
  );
}
