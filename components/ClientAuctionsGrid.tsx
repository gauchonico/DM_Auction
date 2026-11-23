import Link from "next/link";
import type { ClientType } from "@prisma/client";
import { ArrowRight, BadgeCheck, Briefcase, CalendarDays, Landmark, Scale, User } from "lucide-react";
import { CLIENT_GROUPS, SELLER_BADGE } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { getClientsWithActiveSales, type ClientSummary } from "@/lib/queries";
import SectionError, { EmptyState } from "./SectionError";

const CLIENT_ICON: Record<ClientType, typeof Landmark> = {
  BANK: Landmark,
  BAILIFF: Scale,
  RECEIVER: Briefcase,
  PRIVATE: User,
};

function ClientCard({ client }: { client: ClientSummary }) {
  const Icon = CLIENT_ICON[client.type];
  return (
    <li className="flex flex-col rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.05)] transition hover:shadow-[0_12px_32px_-12px_rgba(2,62,138,0.25)]">
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{SELLER_BADGE[client.type].label}</span>
          <h3 className="mt-1.5 line-clamp-2 font-semibold leading-snug text-slate-900">{client.name}</h3>
          {client.verified && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Verified advertiser
            </p>
          )}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-xs text-slate-500">Active sales</dt>
          <dd className="text-lg font-semibold tabular-nums text-slate-900">{client.activeCount}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-xs text-slate-500">Next auction</dt>
          <dd className="flex items-center gap-1 font-medium tabular-nums text-slate-800">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
            <span className="truncate">{client.nextSaleDate ? formatDate(client.nextSaleDate) : "TBA"}</span>
          </dd>
        </div>
      </dl>

      <Link
        href={`/clients/${client.id}`}
        className="mt-4 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-brand-50 px-3 text-sm font-medium text-brand hover:bg-brand hover:text-white"
      >
        View portfolio <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </li>
  );
}

export default async function ClientAuctionsGrid() {
  let clients: ClientSummary[];
  try {
    clients = await getClientsWithActiveSales();
  } catch (error) {
    console.error("[ClientAuctionsGrid] failed to load clients", error);
    return <SectionError message="We couldn't load advertiser portfolios right now. Please refresh in a moment." />;
  }

  if (clients.length === 0) {
    return <EmptyState title="No active advertiser portfolios at the moment" />;
  }

  // One grid (banks first, then bailiffs, receivers, private), each card labelled with its seller type.
  const order = CLIENT_GROUPS.map((g) => g.type);
  const sorted = [...clients].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type) || a.name.localeCompare(b.name));

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((client) => (
        <ClientCard key={client.id} client={client} />
      ))}
    </ul>
  );
}
