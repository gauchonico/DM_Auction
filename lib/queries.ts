import { cache } from "react";
import { Prisma, type ClientType } from "@prisma/client";
import { prisma } from "./prisma";
import { PAGE_SIZE, UGANDA_DISTRICTS } from "./constants";
import { kampalaStartOfToday } from "./format";
import { referenceCandidates } from "./short-links";
import type { SearchFilters } from "./search-params";

/* ------------------------------------------------------------------ */
/* Shared selects & types                                              */
/* ------------------------------------------------------------------ */

export const listingCardSelect = {
  id: true,
  referenceId: true,
  title: true,
  district: true,
  locationDetail: true,
  reservePrice: true,
  saleDate: true,
  deadlineDate: true,
  status: true,
  isFeatured: true,
  category: { select: { name: true, slug: true } },
  client: { select: { id: true, name: true, type: true, verified: true, whatsapp: true } },
  media: {
    where: { type: "IMAGE" },
    orderBy: { sortOrder: "asc" },
    take: 1,
    select: { url: true, caption: true },
  },
} satisfies Prisma.ListingSelect;

export type ListingCardData = Prisma.ListingGetPayload<{ select: typeof listingCardSelect }>;

/** Listings visible to the public: published and not yet past their sale day. */
function upcomingPublishedWhere(): Prisma.ListingWhereInput {
  return { status: "PUBLISHED", saleDate: { gte: kampalaStartOfToday() } };
}

/* ------------------------------------------------------------------ */
/* Home page                                                           */
/* ------------------------------------------------------------------ */

export async function getLatestListings(limit = 8): Promise<ListingCardData[]> {
  return prisma.listing.findMany({
    where: upcomingPublishedWhere(),
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: listingCardSelect,
  });
}

/** Upcoming published auctions that have a photo, featured first — for the hero and banner carousel. */
export async function getBannerListings(limit = 5): Promise<ListingCardData[]> {
  return prisma.listing.findMany({
    where: { ...upcomingPublishedWhere(), media: { some: { type: "IMAGE" } } },
    orderBy: [{ isFeatured: "desc" }, { saleDate: "asc" }],
    take: limit,
    select: listingCardSelect,
  });
}

export interface HomeStats {
  liveAuctions: number;
  verifiedAdvertisers: number;
  districts: number;
  closingThisWeek: number;
}

export async function getHomeStats(): Promise<HomeStats> {
  const active = upcomingPublishedWhere();
  const weekAhead = new Date(kampalaStartOfToday().getTime() + 7 * 24 * 60 * 60 * 1000);
  const [liveAuctions, verifiedAdvertisers, districtRows, closingThisWeek] = await Promise.all([
    prisma.listing.count({ where: active }),
    prisma.client.count({ where: { verified: true, listings: { some: active } } }),
    prisma.listing.findMany({ where: active, distinct: ["district"], select: { district: true } }),
    prisma.listing.count({ where: { ...active, saleDate: { gte: kampalaStartOfToday(), lt: weekAhead } } }),
  ]);
  return { liveAuctions, verifiedAdvertisers, districts: districtRows.length, closingThisWeek };
}

export interface ClientSummary {
  id: string;
  name: string;
  type: ClientType;
  verified: boolean;
  activeCount: number;
  nextSaleDate: Date | null;
}

export async function getClientsWithActiveSales(): Promise<ClientSummary[]> {
  const active = upcomingPublishedWhere();
  const clients = await prisma.client.findMany({
    where: { verified: true, listings: { some: active } },
    select: {
      id: true,
      name: true,
      type: true,
      verified: true,
      _count: { select: { listings: { where: active } } },
      listings: { where: active, orderBy: { saleDate: "asc" }, take: 1, select: { saleDate: true } },
    },
    orderBy: { name: "asc" },
  });

  return clients.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    verified: c.verified,
    activeCount: c._count.listings,
    nextSaleDate: c.listings[0]?.saleDate ?? null,
  }));
}

/* ------------------------------------------------------------------ */
/* Filter options                                                      */
/* ------------------------------------------------------------------ */

export interface FilterOptions {
  categories: { id: string; name: string; slug: string }[];
  tags: { id: string; name: string }[];
  districts: string[];
}

export const getFilterOptions = cache(async (): Promise<FilterOptions> => {
  const [categories, tags, districtRows] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.listing.findMany({
      where: { status: "PUBLISHED" },
      distinct: ["district"],
      select: { district: true },
    }),
  ]);

  const districts = Array.from(
    new Set<string>([...UGANDA_DISTRICTS, ...districtRows.map((r) => r.district)]),
  ).sort((a, b) => a.localeCompare(b));

  return { categories, tags, districts };
});

export async function getCategoriesWithCounts() {
  const active = upcomingPublishedWhere();
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      subTypes: {
        orderBy: { name: "asc" },
        select: { id: true, name: true, _count: { select: { listings: { where: active } } } },
      },
      _count: { select: { listings: { where: active } } },
    },
  });
}

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

export interface SearchResult {
  items: ListingCardData[];
  total: number;
  page: number;
  pageCount: number;
}

function buildSearchWhere(f: SearchFilters): Prisma.ListingWhereInput {
  const and: Prisma.ListingWhereInput[] = [upcomingPublishedWhere()];

  if (f.category) and.push({ category: { slug: f.category } });
  if (f.district) and.push({ district: { equals: f.district, mode: "insensitive" } });
  if (f.tag) and.push({ tags: { some: { tag: { name: { equals: f.tag, mode: "insensitive" } } } } });
  if (f.client) and.push({ clientId: f.client });

  if (f.minPrice !== undefined || f.maxPrice !== undefined) {
    and.push({
      reservePrice: {
        ...(f.minPrice !== undefined ? { gte: new Prisma.Decimal(f.minPrice) } : {}),
        ...(f.maxPrice !== undefined ? { lte: new Prisma.Decimal(f.maxPrice) } : {}),
      },
    });
  }

  if (f.q) {
    const contains = { contains: f.q, mode: "insensitive" as const };
    and.push({
      OR: [
        { title: contains },
        { description: contains },
        { referenceId: contains },
        { locationDetail: contains },
        { district: contains },
        { client: { name: contains } },
      ],
    });
  }

  return { AND: and };
}

function buildSearchOrder(sort: SearchFilters["sort"]): Prisma.ListingOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }];
    case "price_asc":
      return [{ reservePrice: { sort: "asc", nulls: "last" } }, { saleDate: "asc" }];
    case "price_desc":
      return [{ reservePrice: { sort: "desc", nulls: "last" } }, { saleDate: "asc" }];
    case "soonest":
    default:
      return [{ saleDate: "asc" }, { id: "asc" }];
  }
}

export async function searchListings(filters: SearchFilters): Promise<SearchResult> {
  const where = buildSearchWhere(filters);
  const total = await prisma.listing.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);

  const items = await prisma.listing.findMany({
    where,
    orderBy: buildSearchOrder(filters.sort),
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: listingCardSelect,
  });

  return { items, total, page, pageCount };
}

/* ------------------------------------------------------------------ */
/* Listing detail                                                      */
/* ------------------------------------------------------------------ */

const listingDetailInclude = {
  category: { select: { name: true, slug: true } },
  subType: { select: { name: true } },
  client: {
    select: { id: true, name: true, type: true, verified: true, phone: true, whatsapp: true, email: true },
  },
  tags: { select: { tag: { select: { id: true, name: true } } } },
  media: { orderBy: [{ type: "asc" }, { sortOrder: "asc" }] },
} satisfies Prisma.ListingInclude;

export type ListingDetail = Prisma.ListingGetPayload<{ include: typeof listingDetailInclude }>;

/** Public detail lookup: published or expired listings only (pending drafts stay hidden). */
export const getListingById = cache(async (id: string): Promise<ListingDetail | null> => {
  if (!id || id.length > 64) return null;
  return prisma.listing.findFirst({
    where: { id, status: { in: ["PUBLISHED", "EXPIRED"] } },
    include: listingDetailInclude,
  });
});

export async function getRelatedListings(listing: Pick<ListingDetail, "id" | "categoryId" | "district">) {
  return prisma.listing.findMany({
    where: {
      ...upcomingPublishedWhere(),
      id: { not: listing.id },
      OR: [{ categoryId: listing.categoryId }, { district: listing.district }],
    },
    orderBy: { saleDate: "asc" },
    take: 4,
    select: listingCardSelect,
  });
}

/* ------------------------------------------------------------------ */
/* Notice verification                                                 */
/* ------------------------------------------------------------------ */

/**
 * Looks a notice up by the reference a reader typed or scanned, tolerating case, spaces,
 * a missing "DM-" prefix and missing zero-padding (see referenceCandidates). Returns
 * listings in any status — callers decide what each status may show.
 */
export async function getListingByReference(referenceId: string) {
  if (referenceId.trim().length > 64) return null;
  const candidates = referenceCandidates(referenceId);
  if (candidates.length === 0) return null;
  const matches = await prisma.listing.findMany({
    where: { OR: candidates.map((ref) => ({ referenceId: { equals: ref, mode: "insensitive" as const } })) },
    take: candidates.length,
    select: {
      id: true,
      referenceId: true,
      title: true,
      district: true,
      saleDate: true,
      status: true,
      updatedAt: true,
      client: { select: { name: true, type: true, verified: true } },
    },
  });
  // Prefer the most literal match (candidates are ordered from exact to most forgiving).
  for (const ref of candidates) {
    const hit = matches.find((m) => m.referenceId.toUpperCase() === ref);
    if (hit) return hit;
  }
  return matches[0] ?? null;
}

/* ------------------------------------------------------------------ */
/* Client portfolio                                                    */
/* ------------------------------------------------------------------ */

export const getClientPortfolio = cache(async (id: string) => {
  if (!id || id.length > 64) return null;
  return prisma.client.findFirst({
    where: { id, verified: true },
    select: {
      id: true,
      name: true,
      type: true,
      verified: true,
      phone: true,
      whatsapp: true,
      email: true,
      listings: {
        where: upcomingPublishedWhere(),
        orderBy: { saleDate: "asc" },
        select: listingCardSelect,
      },
    },
  });
});
