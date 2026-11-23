export type SortOption = "soonest" | "newest" | "price_asc" | "price_desc";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "soonest", label: "Auction date (soonest)" },
  { value: "newest", label: "Recently listed" },
  { value: "price_asc", label: "Reserve price (low to high)" },
  { value: "price_desc", label: "Reserve price (high to low)" },
];

export interface SearchFilters {
  q?: string;
  category?: string;
  district?: string;
  tag?: string;
  client?: string;
  minPrice?: number;
  maxPrice?: number;
  sort: SortOption;
  page: number;
}

export type RawSearchParams = Record<string, string | string[] | undefined>;

const MAX_TEXT_LENGTH = 100;
const MAX_PAGE = 500;

function firstString(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim().slice(0, MAX_TEXT_LENGTH);
  return trimmed.length > 0 ? trimmed : undefined;
}

function toNonNegativeNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value.replace(/[,\s]/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

function isSortOption(value: string | undefined): value is SortOption {
  return SORT_OPTIONS.some((o) => o.value === value);
}

export function parseSearchFilters(raw: RawSearchParams): SearchFilters {
  let minPrice = toNonNegativeNumber(firstString(raw.minPrice));
  let maxPrice = toNonNegativeNumber(firstString(raw.maxPrice));
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  const sortRaw = firstString(raw.sort);
  const pageRaw = Number(firstString(raw.page) ?? "1");

  return {
    q: firstString(raw.q),
    category: firstString(raw.category),
    district: firstString(raw.district),
    tag: firstString(raw.tag),
    client: firstString(raw.client),
    minPrice,
    maxPrice,
    sort: isSortOption(sortRaw) ? sortRaw : "soonest",
    page: Number.isInteger(pageRaw) && pageRaw >= 1 ? Math.min(pageRaw, MAX_PAGE) : 1,
  };
}

/** Serialises filters into a /search href, omitting defaults. */
export function searchHref(filters: Partial<SearchFilters>): string {
  const params = new URLSearchParams();
  const entries: [string, string | number | undefined][] = [
    ["q", filters.q],
    ["category", filters.category],
    ["district", filters.district],
    ["tag", filters.tag],
    ["client", filters.client],
    ["minPrice", filters.minPrice],
    ["maxPrice", filters.maxPrice],
    ["sort", filters.sort && filters.sort !== "soonest" ? filters.sort : undefined],
    ["page", filters.page && filters.page > 1 ? filters.page : undefined],
  ];
  for (const [key, value] of entries) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

export function hasActiveFilters(f: SearchFilters): boolean {
  return Boolean(
    f.q || f.category || f.district || f.tag || f.client || f.minPrice !== undefined || f.maxPrice !== undefined,
  );
}
