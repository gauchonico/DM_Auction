import { Suspense } from "react";
import ClientAuctionsGrid from "@/components/ClientAuctionsGrid";
import LatestListingsGrid from "@/components/LatestListingsGrid";
import { CardGridSkeleton } from "@/components/SectionError";
import CategoryShowcase from "@/components/home/CategoryShowcase";
import CtaBanner from "@/components/home/CtaBanner";
import FeaturedBanners from "@/components/home/FeaturedBanners";
import Hero from "@/components/home/Hero";
import HowItWorks from "@/components/home/HowItWorks";
import SectionHeader from "@/components/home/SectionHeader";
import TrustStrip from "@/components/home/TrustStrip";
import WhyTrustUs from "@/components/home/WhyTrustUs";
import { UGANDA_DISTRICTS } from "@/lib/constants";
import {
  getBannerListings,
  getCategoriesWithCounts,
  getFilterOptions,
  getHomeStats,
  type FilterOptions,
  type HomeStats,
  type ListingCardData,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Each loader degrades gracefully so a database hiccup never blanks the whole home page. */
async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[home] failed to load ${label}`, error);
    return fallback;
  }
}

export default async function HomePage() {
  const [options, stats, banners, categories] = await Promise.all([
    safe<FilterOptions>("filter options", getFilterOptions, { categories: [], tags: [], districts: [...UGANDA_DISTRICTS] }),
    safe<HomeStats>("stats", getHomeStats, { liveAuctions: 0, verifiedAdvertisers: 0, districts: 0, closingThisWeek: 0 }),
    safe<ListingCardData[]>("banners", () => getBannerListings(5), []),
    safe("categories", getCategoriesWithCounts, [] as Awaited<ReturnType<typeof getCategoriesWithCounts>>),
  ]);

  return (
    <div className="space-y-16 pb-4 sm:space-y-24">
      <div>
        <Hero options={options} stats={stats} featured={banners[0] ?? null} />
        <TrustStrip stats={stats} />
      </div>

      <FeaturedBanners listings={banners} />

      <CategoryShowcase categories={categories} />

      <section aria-labelledby="latest-heading" className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          id="latest-heading"
          eyebrow="Just listed"
          title="Latest verified auctions"
          description="Recently verified listings with upcoming sale dates."
          href="/search"
        />
        <Suspense fallback={<CardGridSkeleton count={4} />}>
          <LatestListingsGrid limit={8} />
        </Suspense>
      </section>

      <WhyTrustUs />

      <section aria-labelledby="clients-heading" className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          id="clients-heading"
          eyebrow="Advertisers"
          title="Browse auctions by advertiser"
          description="Portfolios from verified banks, court bailiffs and receivers."
        />
        <Suspense fallback={<CardGridSkeleton count={4} />}>
          <ClientAuctionsGrid />
        </Suspense>
      </section>

      <HowItWorks />

      <CtaBanner />
    </div>
  );
}
