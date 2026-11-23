import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, Mail, Phone } from "lucide-react";
import { SellerBadge } from "@/components/Badges";
import ListingCard from "@/components/ListingCard";
import { EmptyState } from "@/components/SectionError";
import WhatsAppButton from "@/components/WhatsAppButton";
import { getClientPortfolio } from "@/lib/queries";
import { buildWhatsAppLink, resolveWhatsAppNumber, telLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

interface ClientPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ClientPageProps): Promise<Metadata> {
  const { id } = await params;
  const client = await getClientPortfolio(id);
  if (!client) return { title: "Advertiser not found" };
  return {
    title: `${client.name} — Auction Portfolio`,
    description: `${client.listings.length} upcoming verified auctions from ${client.name}.`,
  };
}

export default async function ClientPortfolioPage({ params }: ClientPageProps) {
  const { id } = await params;
  const client = await getClientPortfolio(id);
  if (!client) notFound();

  const whatsappHref = buildWhatsAppLink(
    resolveWhatsAppNumber(client.whatsapp),
    `Hello ${client.name}, I found your auction listings on DMAuctionHub Uganda and would like more information.`,
  );
  const phoneHref = telLink(client.phone);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <SellerBadge type={client.type} />
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{client.name}</h1>
        {client.verified && (
          <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
            <BadgeCheck className="h-4 w-4" aria-hidden /> Verified advertiser
          </p>
        )}
        <p className="mt-1 text-sm text-slate-600">
          {client.listings.length} upcoming {client.listings.length === 1 ? "auction" : "auctions"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {whatsappHref && <WhatsAppButton href={whatsappHref} label="WhatsApp advertiser" />}
          {phoneHref && (
            <a href={phoneHref} className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-brand px-3 text-sm font-semibold text-brand">
              <Phone className="h-4 w-4" aria-hidden /> {client.phone}
            </a>
          )}
          {client.email && (
            <a href={`mailto:${client.email}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100">
              <Mail className="h-4 w-4" aria-hidden /> {client.email}
            </a>
          )}
        </div>
      </header>

      <section aria-label="Upcoming auctions" className="mt-8">
        {client.listings.length === 0 ? (
          <EmptyState title="No upcoming auctions from this advertiser" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {client.listings.map((listing, i) => (
              <ListingCard key={listing.id} listing={listing} priority={i < 2} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
