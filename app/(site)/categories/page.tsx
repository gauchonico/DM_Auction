import type { Metadata } from "next";
import Link from "next/link";
import { Car, Factory, Home, Package } from "lucide-react";
import { EmptyState } from "@/components/SectionError";
import { getCategoriesWithCounts } from "@/lib/queries";
import { searchHref } from "@/lib/search-params";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse verified auctions by category: real estate, vehicles, machinery and general assets.",
};

const ICONS: Record<string, typeof Home> = {
  "real-estate": Home,
  vehicles: Car,
  machinery: Factory,
};

export default async function CategoriesPage() {
  const categories = await getCategoriesWithCounts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Auction categories</h1>
      <p className="mt-1 text-sm text-slate-600">Upcoming listing counts are updated as notices are verified.</p>

      {categories.length === 0 ? (
        <div className="mt-6"><EmptyState title="No categories configured yet" /></div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {categories.map((category) => {
            const Icon = ICONS[category.slug] ?? Package;
            return (
              <li key={category.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <Link href={searchHref({ category: category.slug })} className="group flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-lg bg-brand text-white">
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-lg font-semibold text-slate-900 group-hover:underline">{category.name}</span>
                    <span className="text-sm text-slate-600">
                      {category._count.listings} upcoming {category._count.listings === 1 ? "auction" : "auctions"}
                    </span>
                  </span>
                </Link>
                {category.subTypes.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {category.subTypes.map((sub) => (
                      <li key={sub.id}>
                        <Link
                          href={searchHref({ category: category.slug, q: sub.name })}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-slate-100 px-3 text-sm font-medium text-slate-600 hover:bg-slate-200"
                        >
                          {sub.name}
                          <span className="rounded-full bg-white px-1.5 text-xs font-semibold text-slate-500">{sub._count.listings}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
