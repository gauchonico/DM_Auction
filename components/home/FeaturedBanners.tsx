import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarClock, MapPin } from "lucide-react";
import type { ListingCardData } from "@/lib/queries";
import { formatDate, formatTime, formatUGX } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media-url";
import { listingWhatsAppLink } from "@/lib/whatsapp";
import { SellerBadge } from "@/components/Badges";
import WhatsAppButton from "@/components/WhatsAppButton";
import SectionHeader from "./SectionHeader";

/**
 * Full-bleed HD banners for upcoming auction items. Swipeable CSS scroll-snap
 * carousel (no JavaScript); only the first banner's image loads eagerly.
 */
export default function FeaturedBanners({ listings }: { listings: ListingCardData[] }) {
  if (listings.length === 0) return null;
  return (
    <section aria-labelledby="spotlight-heading" className="mx-auto max-w-7xl px-4 sm:px-6">
      <SectionHeader
        id="spotlight-heading"
        eyebrow="Spotlight"
        title="Featured auction items"
        description="Hand-picked lots from this week’s verified notices. Swipe to see more."
        href="/search"
      />
      <ul
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
        aria-label="Featured auction banners"
      >
        {listings.map((l, i) => {
          const image = l.media[0];
          const whatsapp = listingWhatsAppLink(l, l.client.whatsapp);
          return (
            <li key={l.id} className="w-[88%] shrink-0 snap-start sm:w-[80%] lg:w-[72%]">
              <article className="relative isolate flex aspect-[4/5] overflow-hidden rounded-[28px] bg-slate-900 sm:aspect-[16/8]">
                {image && (
                  <Image
                    src={resolveMediaUrl(image.url)}
                    alt={image.caption ?? l.title}
                    fill
                    priority={i === 0}
                    sizes="(max-width: 640px) 88vw, (max-width: 1024px) 80vw, 900px"
                    quality={70}
                    className="-z-10 object-cover"
                  />
                )}
                <span className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent sm:bg-gradient-to-r sm:from-slate-950/80 sm:via-slate-950/40 sm:to-transparent" aria-hidden />

                <div className="mt-auto flex w-full flex-col gap-3 p-5 text-white sm:my-auto sm:max-w-md sm:p-10">
                  <div className="flex flex-wrap items-center gap-2">
                    <SellerBadge type={l.client.type} />
                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium backdrop-blur">{l.category.name}</span>
                  </div>
                  <h3 className="text-2xl font-semibold leading-tight tracking-tight sm:text-[32px]">
                    <Link href={`/listings/${l.id}`} className="hover:underline">{l.title}</Link>
                  </h3>
                  <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/80">
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" aria-hidden /> {l.locationDetail ? `${l.locationDetail}, ` : ""}{l.district}</span>
                    <span className="inline-flex items-center gap-1.5 tabular-nums"><CalendarClock className="h-4 w-4" aria-hidden /> {formatDate(l.saleDate)} · {formatTime(l.saleDate)}</span>
                  </p>
                  <p>
                    <span className="block text-xs font-medium uppercase tracking-wide text-white/60">Reserve price</span>
                    <span className="text-2xl font-semibold tabular-nums tracking-tight">{formatUGX(l.reservePrice)}</span>
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Link href={`/listings/${l.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-medium text-slate-900 hover:bg-brand-50">
                      View auction <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                    {whatsapp && <WhatsAppButton href={whatsapp} label="WhatsApp" />}
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
