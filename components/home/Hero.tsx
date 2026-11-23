import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Car, Factory, Home, MapPin, Package, ShieldCheck } from "lucide-react";
import type { FilterOptions, HomeStats, ListingCardData } from "@/lib/queries";
import { formatDate, formatUGX } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media-url";
import { siteImage } from "@/lib/site-images";
import SearchFilterForm from "@/components/SearchFilterForm";

const QUICK_CATEGORIES = [
  { slug: "real-estate", label: "Property", icon: Home },
  { slug: "vehicles", label: "Vehicles", icon: Car },
  { slug: "machinery", label: "Machinery", icon: Factory },
  { slug: "general-assets", label: "General assets", icon: Package },
];

export default function Hero({ options, stats, featured }: { options: FilterOptions; stats: HomeStats; featured: ListingCardData | null }) {
  const featuredImage = featured?.media[0];
  return (
    <section className="relative overflow-hidden">
      {/* soft background wash */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_15%_0%,#EEF4FB_0%,transparent_70%),radial-gradient(40%_50%_at_100%_20%,#E0F2FE_0%,transparent_70%)]" aria-hidden />

      {/* Desktop: compact ~340px hero (image fixed at 340px, copy sized to fit beside it). */}
      <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-12 pt-10 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-10 lg:pb-10 lg:pt-8">
        {/* Copy + search */}
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-50">
              <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
            </span>
            Verified notices from banks, court bailiffs &amp; receivers
          </p>
          <h1 className="mt-5 text-[38px] font-semibold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:mt-4 lg:text-[42px] lg:leading-[1.1]">
            Find verified auctions{" "}
            <span className="bg-gradient-to-r from-brand via-[#0353A4] to-sky-500 bg-clip-text text-transparent">across Uganda</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg lg:mt-3 lg:text-base">
            Land, houses, vehicles and machinery advertised in the Daily Monitor — with full particulars, photos and
            direct WhatsApp contact with the seller.
          </p>

          <div className="mt-8 lg:mt-5">
            <SearchFilterForm options={options} variant="hero" />
          </div>

          {/* Quick links: mobile/tablet only — on desktop the search card and category section cover them. */}
          <ul className="mt-6 flex flex-wrap gap-2 lg:hidden" aria-label="Browse by category">
            {QUICK_CATEGORIES.map(({ slug, label, icon: Icon }) => (
              <li key={slug}>
                <Link
                  href={`/search?category=${slug}`}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:border-brand/30 hover:text-brand"
                >
                  <Icon className="h-4 w-4 text-slate-400" aria-hidden /> {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* HD image with floating cards */}
        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] shadow-[0_30px_60px_-30px_rgba(2,62,138,0.45)] sm:aspect-[5/4] lg:aspect-auto lg:h-[340px]">
            <Image
              src={siteImage("hero")}
              alt="Modern house with large windows and palm trees"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 600px"
              quality={70}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" aria-hidden />
          </div>

          {/* stat chip */}
          <div className="absolute -left-3 top-6 hidden items-center gap-3 rounded-2xl bg-white/95 p-3 pr-4 shadow-xl backdrop-blur sm:flex">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-semibold tabular-nums text-slate-900">{stats.liveAuctions}</span>
              <span className="text-xs text-slate-500">live verified auctions</span>
            </span>
          </div>

          {/* featured listing card */}
          {featured && (
            <Link
              href={`/listings/${featured.id}`}
              className="group absolute -bottom-6 right-3 lg:bottom-4 flex w-[min(20rem,calc(100%-1.5rem))] items-center gap-3 rounded-2xl bg-white p-2.5 shadow-xl ring-1 ring-slate-100 sm:right-6"
            >
              <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {featuredImage && (
                  <Image src={resolveMediaUrl(featuredImage.url)} alt="" fill sizes="80px" quality={55} className="object-cover" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-medium text-brand">{featured.isFeatured ? "Featured" : "Next auction"} · {formatDate(featured.saleDate)}</span>
                <span className="block truncate text-sm font-semibold text-slate-900 group-hover:text-brand">{featured.title}</span>
                <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden /> {featured.district}
                  <span className="ml-auto font-semibold tabular-nums text-slate-800">{formatUGX(featured.reservePrice, "See notice")}</span>
                </span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-brand" aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
