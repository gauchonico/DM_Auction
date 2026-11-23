import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarClock, Car, Factory, Home, MapPin, Package } from "lucide-react";
import type { ListingCardData } from "@/lib/queries";
import { formatDate, formatTime, formatUGX } from "@/lib/format";
import { listingWhatsAppLink } from "@/lib/whatsapp";
import { resolveMediaUrl } from "@/lib/media-url";
import { SellerBadge, StatusBadge } from "./Badges";
import WhatsAppButton from "./WhatsAppButton";

const CATEGORY_ICON: Record<string, typeof Home> = {
  "real-estate": Home,
  vehicles: Car,
  machinery: Factory,
};

function Thumbnail({ listing, priority }: { listing: ListingCardData; priority: boolean }) {
  const image = listing.media[0];
  if (image) {
    return (
      <Image
        src={resolveMediaUrl(image.url)}
        alt={image.caption ?? listing.title}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        quality={65}
        priority={priority}
        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      />
    );
  }
  const Icon = CATEGORY_ICON[listing.category.slug] ?? Package;
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-brand-50 to-sky-50 text-brand/50">
      <Icon className="h-10 w-10" aria-hidden />
      <span className="text-xs font-medium">Photo in printed notice</span>
    </div>
  );
}

export default function ListingCard({ listing, priority = false }: { listing: ListingCardData; priority?: boolean }) {
  const whatsappHref = listingWhatsAppLink(listing, listing.client.whatsapp);
  const detailHref = `/listings/${listing.id}`;
  const hasPrice = formatUGX(listing.reservePrice, "") !== "";

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-[0_1px_3px_rgba(16,24,40,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-12px_rgba(2,62,138,0.25)]">
      <Link href={detailHref} className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-slate-100" tabIndex={-1} aria-hidden>
        <Thumbnail listing={listing} priority={priority} />
        <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
          <SellerBadge type={listing.client.type} className="shadow-sm" />
          <StatusBadge status={listing.status} isFeatured={listing.isFeatured} deadlineDate={listing.deadlineDate} saleDate={listing.saleDate} />
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-2.5 pb-2 pt-3.5">
        <p className="text-xs font-medium text-slate-400">
          {listing.category.name} · <span className="tabular-nums">{listing.referenceId}</span>
        </p>
        <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-slate-900">
          <Link href={detailHref} className="hover:text-brand">
            {listing.title}
          </Link>
        </h3>
        <p className="mt-1.5 flex items-center gap-1 text-sm text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
          <span className="truncate">
            {listing.locationDetail ? `${listing.locationDetail}, ` : ""}
            {listing.district}
          </span>
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dashed border-slate-100 pt-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand">
            <CalendarClock className="h-3.5 w-3.5" aria-hidden />
            <time dateTime={listing.saleDate.toISOString()} className="tabular-nums">
              {formatDate(listing.saleDate)} · {formatTime(listing.saleDate)}
            </time>
          </span>
        </div>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Reserve price</p>
            <p className={hasPrice ? "text-lg font-semibold tabular-nums tracking-tight text-brand" : "text-sm font-medium italic text-slate-500"}>
              {formatUGX(listing.reservePrice)}
            </p>
          </div>
        </div>

        <div className={`mt-4 grid gap-2 ${whatsappHref ? "grid-cols-2" : "grid-cols-1"} mt-auto pt-3`}>
          <Link
            href={detailHref}
            className="inline-flex min-h-11 items-center justify-center gap-1 whitespace-nowrap rounded-xl border border-slate-200 px-2 text-sm font-medium text-slate-700 hover:border-brand/30 hover:text-brand"
          >
            Details <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
          {whatsappHref && <WhatsAppButton href={whatsappHref} label="WhatsApp" />}
        </div>
      </div>
    </article>
  );
}
