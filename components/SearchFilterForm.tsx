import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import type { FilterOptions } from "@/lib/queries";
import { SORT_OPTIONS, type SearchFilters } from "@/lib/search-params";

interface SearchFilterFormProps {
  options: FilterOptions;
  defaults?: Partial<SearchFilters>;
  variant?: "hero" | "sidebar";
}

const fieldClass =
  "block min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base text-slate-800 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 sm:text-sm";
const labelClass = "mb-1.5 block text-xs font-medium text-slate-500";

function SelectField({
  name,
  label,
  placeholder,
  value,
  items,
}: {
  name: string;
  label: string;
  placeholder: string;
  value?: string;
  items: { value: string; label: string }[];
}) {
  const id = `filter-${name}`;
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <select id={id} name={name} defaultValue={value ?? ""} className={fieldClass}>
        <option value="">{placeholder}</option>
        {items.map((item) => (
          <option key={item.value} value={item.value}>{item.label}</option>
        ))}
      </select>
    </div>
  );
}

/**
 * Plain GET form that submits to /search — works without JavaScript and
 * redirects instantly to server-filtered results.
 */
export default function SearchFilterForm({ options, defaults = {}, variant = "hero" }: SearchFilterFormProps) {
  const categoryItems = options.categories.map((c) => ({ value: c.slug, label: c.name }));
  const districtItems = options.districts.map((d) => ({ value: d, label: d }));
  const tagItems = options.tags.map((t) => ({ value: t.name, label: t.name }));

  if (variant === "hero") {
    return (
      <form action="/search" method="get" role="search" className="rounded-2xl bg-white p-3 shadow-[0_20px_50px_-20px_rgba(2,62,138,0.35)] ring-1 ring-slate-100 sm:p-4">
        <div className="grid grid-cols-2 items-end gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <SelectField name="category" label="Category" placeholder="All" value={defaults.category} items={categoryItems} />
          <SelectField name="district" label="District" placeholder="All" value={defaults.district} items={districtItems} />
          <SelectField name="tag" label="Asset type" placeholder="Any" value={defaults.tag} items={tagItems} />
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-base font-medium text-white shadow-sm hover:bg-brand-light"
          >
            <Search className="h-5 w-5" aria-hidden />
            Search
          </button>
        </div>
      </form>
    );
  }

  return (
    <form action="/search" method="get" role="search" className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.06)]">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <SlidersHorizontal className="h-4 w-4" aria-hidden /> Filter auctions
      </p>

      <div>
        <label htmlFor="filter-q" className={labelClass}>Keyword or reference</label>
        <input
          id="filter-q"
          name="q"
          type="search"
          defaultValue={defaults.q ?? ""}
          placeholder="e.g. Ntinda, Land Cruiser, DM-2026-…"
          maxLength={100}
          className={fieldClass}
        />
      </div>

      <SelectField name="category" label="Category" placeholder="All categories" value={defaults.category} items={categoryItems} />
      <SelectField name="district" label="District" placeholder="All districts" value={defaults.district} items={districtItems} />
      <SelectField name="tag" label="Asset type" placeholder="Any asset type" value={defaults.tag} items={tagItems} />

      <fieldset>
        <legend className={labelClass}>Reserve price (UGX)</legend>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="filter-minPrice" className="sr-only">Minimum price</label>
            <input
              id="filter-minPrice"
              name="minPrice"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000000}
              placeholder="Min"
              defaultValue={defaults.minPrice ?? ""}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="filter-maxPrice" className="sr-only">Maximum price</label>
            <input
              id="filter-maxPrice"
              name="maxPrice"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000000}
              placeholder="Max"
              defaultValue={defaults.maxPrice ?? ""}
              className={fieldClass}
            />
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-500">Listings marked “Refer to Notice” are excluded when a price is set.</p>
      </fieldset>

      <SelectField
        name="sort"
        label="Sort by"
        placeholder="Auction date (soonest)"
        value={defaults.sort === "soonest" ? undefined : defaults.sort}
        items={SORT_OPTIONS.filter((o) => o.value !== "soonest").map((o) => ({ value: o.value, label: o.label }))}
      />

      {defaults.client && <input type="hidden" name="client" value={defaults.client} />}

      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/search"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Reset
        </Link>
        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-medium text-white hover:bg-brand-light"
        >
          <Search className="h-4 w-4" aria-hidden /> Apply
        </button>
      </div>
    </form>
  );
}
