import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import Pagination from "@/components/Pagination";
import SearchFilterForm from "@/components/SearchFilterForm";
import { EmptyState } from "@/components/SectionError";
import { formatUGX } from "@/lib/format";
import { getFilterOptions, searchListings } from "@/lib/queries";
import {
  hasActiveFilters,
  parseSearchFilters,
  searchHref,
  type RawSearchParams,
  type SearchFilters,
} from "@/lib/search-params";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse Auctions",
  description: "Search verified auction listings across Uganda by category, district and reserve price.",
};

interface SearchPageProps {
  searchParams: Promise<RawSearchParams>;
}

function ActiveFilterChips({
  filters,
  categoryName,
}: {
  filters: SearchFilters;
  categoryName?: string;
}) {
  const chips: { key: keyof SearchFilters; label: string }[] = [];
  if (filters.q) chips.push({ key: "q", label: `“${filters.q}”` });
  if (filters.category) chips.push({ key: "category", label: categoryName ?? filters.category });
  if (filters.district) chips.push({ key: "district", label: filters.district });
  if (filters.tag) chips.push({ key: "tag", label: filters.tag });
  if (filters.client) chips.push({ key: "client", label: "Selected advertiser" });
  if (filters.minPrice !== undefined) chips.push({ key: "minPrice", label: `From ${formatUGX(filters.minPrice, "UGX 0")}` });
  if (filters.maxPrice !== undefined) chips.push({ key: "maxPrice", label: `Up to ${formatUGX(filters.maxPrice, "UGX 0")}` });

  if (chips.length === 0) return null;

  return (
    <ul className="mb-4 flex flex-wrap gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <li key={chip.key}>
          <Link
            href={searchHref({ ...filters, [chip.key]: undefined, page: 1 })}
            className="inline-flex min-h-9 items-center gap-1 rounded-full bg-brand-50 px-3 text-sm font-semibold text-brand ring-1 ring-brand/15 hover:bg-brand hover:text-white"
            aria-label={`Remove filter ${chip.label}`}
          >
            {chip.label}
            <X className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const filters = parseSearchFilters(await searchParams);
  const [options, result] = await Promise.all([getFilterOptions(), searchListings(filters)]);
  const categoryName = options.categories.find((c) => c.slug === filters.category)?.name;

  const heading = [categoryName ?? "Auctions", filters.district ? `in ${filters.district}` : ""].filter(Boolean).join(" ");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{heading}</h1>
        <p className="text-sm text-slate-600" aria-live="polite">
          {result.total === 1 ? "1 upcoming listing" : `${result.total.toLocaleString("en-UG")} upcoming listings`}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside>
          {/* Collapsed by default on mobile to put results first; always open on desktop via lg:block. */}
          <details className="group lg:hidden" open={false}>
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 [&::-webkit-details-marker]:hidden">
              <span className="group-open:hidden">Show filters</span>
              <span className="hidden group-open:inline">Hide filters</span>
            </summary>
            <div className="mt-3">
              <SearchFilterForm options={options} defaults={filters} variant="sidebar" />
            </div>
          </details>
          <div className="hidden lg:sticky lg:top-20 lg:block">
            <SearchFilterForm options={options} defaults={filters} variant="sidebar" />
          </div>
        </aside>

        <section aria-label="Search results">
          <ActiveFilterChips filters={filters} categoryName={categoryName} />

          {result.items.length === 0 ? (
            <EmptyState title="No auctions match your filters">
              {hasActiveFilters(filters) ? (
                <p>
                  Try widening your search or{" "}
                  <Link href="/search" className="font-semibold text-brand underline">
                    clear all filters
                  </Link>
                  .
                </p>
              ) : (
                <p>New verified notices are added daily — please check back soon.</p>
              )}
            </EmptyState>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {result.items.map((listing, i) => (
                  <ListingCard key={listing.id} listing={listing} priority={i < 2} />
                ))}
              </div>
              <Pagination filters={filters} page={result.page} pageCount={result.pageCount} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
