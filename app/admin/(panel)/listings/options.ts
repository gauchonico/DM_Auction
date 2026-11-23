import { prisma } from "@/lib/prisma";
import { UGANDA_DISTRICTS } from "@/lib/constants";
import type { ListingFormOptions } from "./ListingForm";

export async function loadListingFormOptions(): Promise<ListingFormOptions> {
  const [categories, clients, tags, districtRows] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, subTypes: { orderBy: { name: "asc" }, select: { id: true, name: true } } },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, verified: true } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.listing.findMany({ distinct: ["district"], select: { district: true } }),
  ]);
  const districts = Array.from(new Set([...UGANDA_DISTRICTS, ...districtRows.map((r) => r.district)])).sort();
  return { categories, clients, tags, districts };
}
