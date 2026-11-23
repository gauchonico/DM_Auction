import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { categoryImage } from "@/lib/site-images";
import SectionHeader from "./SectionHeader";

interface CategoryCount {
  id: string;
  name: string;
  slug: string;
  _count: { listings: number };
}

/** "Browse by category" — HD image cards (real-estate reference). */
export default function CategoryShowcase({ categories }: { categories: CategoryCount[] }) {
  if (categories.length === 0) return null;
  return (
    <section aria-labelledby="categories-heading" className="mx-auto max-w-7xl px-4 sm:px-6">
      <SectionHeader id="categories-heading" eyebrow="Browse" title="Auctions by category" href="/categories" linkLabel="All categories" />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              href={`/search?category=${c.slug}`}
              className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-slate-100 sm:aspect-[3/4]"
            >
              <Image
                src={categoryImage(c.slug)}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                quality={60}
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" aria-hidden />
              <span className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-slate-800 shadow-sm transition group-hover:bg-white group-hover:text-brand">
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </span>
              <span className="absolute inset-x-5 bottom-5 text-white">
                <span className="block text-xl font-semibold tracking-tight">{c.name}</span>
                <span className="mt-1 inline-flex rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium tabular-nums backdrop-blur">
                  {c._count.listings} upcoming {c._count.listings === 1 ? "auction" : "auctions"}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
