import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  ChevronLeft,
  ClipboardList,
  FileText,
  Hourglass,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { SellerBadge, StatusBadge } from "@/components/Badges";
import ImageGallery from "@/components/ImageGallery";
import ListingCard from "@/components/ListingCard";
import WhatsAppButton from "@/components/WhatsAppButton";
import { LEGAL_DISCLAIMER } from "@/lib/constants";
import { formatDateTime, formatLongDate, formatTime, formatUGX } from "@/lib/format";
import { getListingById, getRelatedListings, type ListingCardData } from "@/lib/queries";
import { searchHref } from "@/lib/search-params";
import { listingWhatsAppLink, telLink } from "@/lib/whatsapp";
import { resolveMediaUrl } from "@/lib/media-url";

export const dynamic = "force-dynamic";

interface ListingPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) return { title: "Listing not found" };

  const description = `${listing.category.name} auction in ${listing.district} on ${formatLongDate(listing.saleDate)}. Reserve: ${formatUGX(listing.reservePrice)}. Ref ${listing.referenceId}.`;
  const image = listing.media.find((m) => m.type === "IMAGE");
  return {
    title: listing.title,
    description,
    openGraph: { title: listing.title, description, images: image ? [{ url: resolveMediaUrl(image.url) }] : undefined },
    robots: listing.status === "EXPIRED" ? { index: false } : undefined,
  };
}

function Fact({ icon: Icon, label, children }: { icon: typeof MapPin; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
        <dd className="font-semibold text-slate-900">{children}</dd>
      </div>
    </div>
  );
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) notFound();

  let related: ListingCardData[] = [];
  try {
    related = await getRelatedListings(listing);
  } catch (error) {
    console.error("[listing] failed to load related listings", error);
  }

  const images = listing.media.filter((m) => m.type === "IMAGE");
  const documents = listing.media.filter((m) => m.type === "DOCUMENT");
  const whatsappHref = listingWhatsAppLink(listing, listing.client.whatsapp);
  const phoneHref = telLink(listing.client.phone);
  const isClosed = listing.status === "EXPIRED" || listing.saleDate.getTime() < Date.now();
  const paragraphs = listing.description.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <nav aria-label="Breadcrumb" className="mb-4">
        <Link
          href={searchHref({ category: listing.category.slug })}
          className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand hover:underline"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden /> {listing.category.name}
        </Link>
      </nav>

      {isClosed && (
        <div role="status" className="mb-4 flex items-start gap-2 rounded-lg border border-slate-300 bg-slate-100 p-3 text-sm text-slate-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          This auction has closed. The listing is kept for reference only.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          <ImageGallery images={images} title={listing.title} />

          <header>
            <div className="flex flex-wrap items-center gap-2">
              <SellerBadge type={listing.client.type} />
              <StatusBadge
                status={listing.status}
                isFeatured={listing.isFeatured}
                deadlineDate={listing.deadlineDate}
                saleDate={listing.saleDate}
              />
              <span className="text-xs font-semibold text-slate-500">Ref {listing.referenceId}</span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight leading-tight text-slate-900 sm:text-3xl">{listing.title}</h1>
            <p className="mt-1 flex items-center gap-1 text-slate-600">
              <MapPin className="h-4 w-4 shrink-0 text-brand" aria-hidden />
              {listing.locationDetail ? `${listing.locationDetail}, ` : ""}
              {listing.district} District
            </p>
          </header>

          <dl className="grid gap-3 sm:grid-cols-2">
            <Fact icon={CalendarClock} label="Auction date & time">
              <time dateTime={listing.saleDate.toISOString()}>
                {formatLongDate(listing.saleDate)}, {formatTime(listing.saleDate)}
              </time>
            </Fact>
            {listing.deadlineDate && (
              <Fact icon={Hourglass} label="Bid / registration deadline">
                <time dateTime={listing.deadlineDate.toISOString()}>{formatDateTime(listing.deadlineDate)}</time>
              </Fact>
            )}
            <Fact icon={ClipboardList} label="Category">
              {listing.category.name}
              {listing.subType ? ` · ${listing.subType.name}` : ""}
            </Fact>
            <Fact icon={MapPin} label="District">{listing.district}</Fact>
          </dl>

          <section aria-labelledby="particulars-heading">
            <h2 id="particulars-heading" className="text-lg font-semibold text-slate-900">Property particulars</h2>
            <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-slate-600">
              {paragraphs.map((p, i) => (
                <p key={i} className="whitespace-pre-line">{p}</p>
              ))}
            </div>
            {listing.tags.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
                {listing.tags.map(({ tag }) => (
                  <li key={tag.id}>
                    <Link
                      href={searchHref({ tag: tag.name })}
                      className="inline-flex min-h-9 items-center rounded-full bg-slate-100 px-3 text-sm font-medium text-slate-600 hover:bg-slate-200"
                    >
                      {tag.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="inspection-heading" className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h2 id="inspection-heading" className="text-lg font-semibold text-slate-900">Inspection instructions</h2>
            <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-slate-800">
              {listing.inspectionNotes ??
                "Viewing is by appointment only. Contact the advertiser below to arrange an inspection before the auction date. Intending bidders are advised to carry a valid national ID."}
            </p>
          </section>

          {documents.length > 0 && (
            <section aria-labelledby="documents-heading">
              <h2 id="documents-heading" className="text-lg font-semibold text-slate-900">Notice documents</h2>
              <ul className="mt-2 space-y-2">
                {documents.map((doc) => (
                  <li key={doc.id}>
                    <a
                      href={resolveMediaUrl(doc.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-12 items-center gap-2 rounded-2xl border border-slate-100 bg-white px-3 font-semibold text-brand hover:bg-brand-50"
                    >
                      <FileText className="h-5 w-5 shrink-0" aria-hidden />
                      {doc.caption ?? "Download auction notice (PDF)"}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reserve price</p>
            <p className="text-2xl font-semibold tracking-tight text-slate-900">{formatUGX(listing.reservePrice)}</p>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Advertised by</p>
              <p className="mt-1 font-semibold text-slate-900">{listing.client.name}</p>
              {listing.client.verified && (
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Verified advertiser
                </p>
              )}
              <Link href={`/clients/${listing.client.id}`} className="mt-1 block text-sm font-semibold text-brand hover:underline">
                View all sales by this advertiser
              </Link>
            </div>

            {!isClosed && (
              <div className="mt-4 grid gap-2">
                {whatsappHref && <WhatsAppButton href={whatsappHref} size="lg" />}
                {phoneHref && (
                  <a
                    href={phoneHref}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-brand px-5 text-base font-semibold text-brand hover:bg-brand hover:text-white"
                  >
                    <Phone className="h-5 w-5" aria-hidden /> Call {listing.client.phone}
                  </a>
                )}
                {listing.client.email && (
                  <a
                    href={`mailto:${listing.client.email}?subject=${encodeURIComponent(`Enquiry: ${listing.referenceId} — ${listing.title}`)}`}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    <Mail className="h-4 w-4" aria-hidden /> Email advertiser
                  </a>
                )}
                {!whatsappHref && !phoneHref && !listing.client.email && (
                  <p className="text-sm text-slate-600">Contact details are provided in the printed notice.</p>
                )}
              </div>
            )}
          </div>

          <p className="rounded-lg bg-slate-100 p-3 text-xs leading-relaxed text-slate-600">{LEGAL_DISCLAIMER}</p>
        </aside>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-12">
          <h2 id="related-heading" className="mb-4 text-xl font-semibold tracking-tight text-slate-900">Similar auctions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
