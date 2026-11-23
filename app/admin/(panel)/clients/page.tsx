import Link from "next/link";
import { BadgeCheck, Plus } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SELLER_BADGE } from "@/lib/constants";
import { EmptyRow, Notice, PageHeader, buttonPrimary, buttonSmall, td, th } from "@/components/admin/ui";

export const metadata = { title: "Clients" };

export default async function AdminClientsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const staff = await requireStaff();
  const params = await searchParams;
  const isAdmin = staff.role === "ADMIN";

  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      type: true,
      verified: true,
      phone: true,
      whatsapp: true,
      _count: { select: { listings: true } },
    },
  });
  const liveCounts = await prisma.listing.groupBy({ by: ["clientId"], where: { status: "PUBLISHED" }, _count: { _all: true } });
  const live = new Map(liveCounts.map((c) => [c.clientId, c._count._all]));

  return (
    <>
      <PageHeader
        title="Clients"
        description="Banks, bailiffs, receivers and private sellers who advertise auctions."
        actions={isAdmin && <Link href="/admin/clients/new" className={buttonPrimary}><Plus className="h-4 w-4" aria-hidden /> New client</Link>}
      />
      <Notice code={params.error ?? params.notice} />

      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-card">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-slate-100 bg-slate-50/70">
            <tr>
              <th className={th}>Client</th>
              <th className={th}>Type</th>
              <th className={th}>Contact</th>
              <th className={th}>Listings</th>
              <th className={`${th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.length === 0 && <EmptyRow colSpan={5}>No clients yet.</EmptyRow>}
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className={td}>
                  <span className="font-semibold text-slate-900">{c.name}</span>
                  {c.verified ? (
                    <span className="ml-2 inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-700"><BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Verified</span>
                  ) : (
                    <span className="ml-2 text-xs font-semibold text-slate-400">Unverified</span>
                  )}
                </td>
                <td className={td}>{SELLER_BADGE[c.type].label}</td>
                <td className={`${td} text-xs text-slate-600`}>
                  {c.phone && <div>Tel {c.phone}</div>}
                  {c.whatsapp && <div>WhatsApp +{c.whatsapp}</div>}
                  {!c.phone && !c.whatsapp && "—"}
                </td>
                <td className={td}>
                  <Link href={`/admin/listings?client=${c.id}`} className="text-brand hover:underline">
                    {c._count.listings} total · {live.get(c.id) ?? 0} published
                  </Link>
                </td>
                <td className={`${td} text-right`}>
                  {isAdmin ? <Link href={`/admin/clients/${c.id}`} className={buttonSmall}>Edit</Link> : <span className="text-xs text-slate-400">View only</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
