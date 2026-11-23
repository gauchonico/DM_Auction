/**
 * Development seed. All organisations, people and phone numbers below are
 * fictional sample data — replace with real verified clients before launch.
 */
import type { ClientType, ListingStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { attachListingMedia, deleteObject } from "../lib/storage";
import { sampleNoticePdf, samplePhotoPng } from "./sample-media";

const DAY = 24 * 60 * 60 * 1000;

/** A date `days` from now at the given Kampala hour (UTC+3). */
function kampalaDate(days: number, hour = 10, minute = 0): Date {
  const d = new Date(Date.now() + days * DAY);
  d.setUTCHours(hour - 3, minute, 0, 0);
  return d;
}


const CATEGORIES: { name: string; slug: string; subTypes: string[] }[] = [
  { name: "Real Estate", slug: "real-estate", subTypes: ["Residential House", "Commercial Building", "Vacant Land", "Apartment"] },
  { name: "Vehicles", slug: "vehicles", subTypes: ["Saloon Car", "SUV", "Truck", "Motorcycle"] },
  { name: "Machinery", slug: "machinery", subTypes: ["Construction Equipment", "Agricultural Machinery", "Industrial Plant"] },
  { name: "General Assets", slug: "general-assets", subTypes: ["Household Goods", "Office Equipment", "Stock & Inventory"] },
];

const TAGS = [
  "Mailo Land",
  "Freehold",
  "Leasehold",
  "Residential",
  "Commercial",
  "Saloon Car",
  "Heavy Truck",
  "Earth Mover",
  "Tractor",
  "Office Furniture",
];

const CLIENTS: { key: string; name: string; type: ClientType; phone: string; whatsapp: string; email: string }[] = [
  { key: "pearl", name: "Pearl Commercial Bank (Sample)", type: "BANK", phone: "0700 000101", whatsapp: "0700000101", email: "recoveries@pearlbank.example" },
  { key: "kcb", name: "Kampala Capital Bank (Sample)", type: "BANK", phone: "0700 000102", whatsapp: "0700000102", email: "assets@kampalacapital.example" },
  { key: "lex", name: "Lex & Order Court Bailiffs (Sample)", type: "BAILIFF", phone: "0700 000201", whatsapp: "0700000201", email: "sales@lexorder.example" },
  { key: "equator", name: "Equator Auctioneers & Court Bailiffs (Sample)", type: "BAILIFF", phone: "0700 000202", whatsapp: "0700000202", email: "info@equatorauctions.example" },
  { key: "victoria", name: "Victoria Receivers & Managers (Sample)", type: "RECEIVER", phone: "0700 000301", whatsapp: "0700000301", email: "receivership@victoria.example" },
];

interface SeedListing {
  ref: string;
  title: string;
  description: string;
  category: string;
  subType: string;
  district: string;
  location: string;
  price: number | null;
  saleInDays: number;
  deadlineInDays?: number;
  client: string;
  tags: string[];
  featured?: boolean;
  status?: ListingStatus;
  photos: string[];
  inspection?: string;
  document?: boolean;
}

const LISTINGS: SeedListing[] = [
  {
    ref: "DM-2026-0142",
    title: "4-Bedroom Residential House on 25 Decimals",
    description:
      "Fully developed four-bedroom bungalow with boys' quarters, perimeter wall and gate, comprised in Kyadondo Block 216 Plot 1043.\n\nThe property is connected to piped water and grid electricity and sits on a tarmac access road.",
    category: "real-estate", subType: "Residential House", district: "Kampala", location: "Ntinda, Kigoowa",
    price: 450_000_000, saleInDays: 9, deadlineInDays: 8, client: "pearl", tags: ["Mailo Land", "Residential"], featured: true,
    photos: ["ntinda-house-1", "ntinda-house-2", "ntinda-house-3"],
    inspection: "Inspection on Saturdays between 10:00 AM and 1:00 PM. Contact the bank's recoveries desk 24 hours in advance.",
    document: true,
  },
  {
    ref: "DM-2026-0151",
    title: "Commercial Building with 12 Shop Units",
    description: "Two-storey commercial block with twelve lock-up shops along the main road, currently tenanted.",
    category: "real-estate", subType: "Commercial Building", district: "Mukono", location: "Mukono Town, Kampala–Jinja Road",
    price: 1_200_000_000, saleInDays: 14, client: "victoria", tags: ["Freehold", "Commercial"], featured: true,
    photos: ["mukono-commercial-1", "mukono-commercial-2"],
  },
  {
    ref: "DM-2026-0157",
    title: "Vacant Plot Measuring 50 x 100 ft",
    description: "Vacant, gently sloping plot in a developed residential neighbourhood, with access to water and power.",
    category: "real-estate", subType: "Vacant Land", district: "Wakiso", location: "Kira, Najjera",
    price: 85_000_000, saleInDays: 5, deadlineInDays: 2, client: "lex", tags: ["Mailo Land", "Residential"],
    photos: ["najjera-plot-1"],
  },
  {
    ref: "DM-2026-0163",
    title: "Toyota Land Cruiser Prado TX, 2016",
    description: "Diesel, automatic, 156,000 km. Repossessed vehicle in running condition, parked at the bailiff's yard.",
    category: "vehicles", subType: "SUV", district: "Kampala", location: "Bailiff's yard, Nakawa",
    price: 110_000_000, saleInDays: 6, client: "equator", tags: ["Saloon Car"],
    photos: ["prado-1", "prado-2", "prado-3"],
    inspection: "Vehicle can be inspected at the yard Monday to Friday, 9:00 AM – 4:00 PM. Bring a valid ID.",
  },
  {
    ref: "DM-2026-0170",
    title: "Toyota Premio, 2010 — UBA Series",
    description: "Petrol, automatic, 1800cc. Minor body scratches. Logbook available at the bank.",
    category: "vehicles", subType: "Saloon Car", district: "Jinja", location: "Jinja Central",
    price: null, saleInDays: 11, client: "kcb", tags: ["Saloon Car"],
    photos: ["premio-1"],
  },
  {
    ref: "DM-2026-0174",
    title: "Isuzu FVZ Tipper Truck, 2014",
    description: "10-wheeler tipper, 6HK1 engine, in fair mechanical condition.",
    category: "vehicles", subType: "Truck", district: "Gulu", location: "Gulu Industrial Area",
    price: 95_000_000, saleInDays: 18, client: "lex", tags: ["Heavy Truck"],
    photos: ["tipper-1", "tipper-2"],
  },
  {
    ref: "DM-2026-0181",
    title: "Caterpillar 320D Excavator",
    description: "Hydraulic crawler excavator, approx. 11,400 operating hours. Sold as is.",
    category: "machinery", subType: "Construction Equipment", district: "Wakiso", location: "Namanve",
    price: 210_000_000, saleInDays: 21, client: "victoria", tags: ["Earth Mover"],
    photos: ["excavator-1", "excavator-2"],
  },
  {
    ref: "DM-2026-0186",
    title: "Massey Ferguson 375 Tractor with Plough",
    description: "4WD tractor with three-disc plough and trailer. Good working condition.",
    category: "machinery", subType: "Agricultural Machinery", district: "Lira", location: "Lira Municipality",
    price: 48_000_000, saleInDays: 12, client: "equator", tags: ["Tractor"],
    photos: ["tractor-1"],
  },
  {
    ref: "DM-2026-0190",
    title: "Office Furniture & IT Equipment — Assorted Lots",
    description:
      "Assorted lots including executive desks, office chairs, filing cabinets, desktop computers and printers from a company under receivership.",
    category: "general-assets", subType: "Office Equipment", district: "Kampala", location: "Nakasero",
    price: null, saleInDays: 4, client: "victoria", tags: ["Office Furniture"],
    photos: ["office-lots-1"],
  },
  {
    ref: "DM-2026-0195",
    title: "3-Bedroom Apartment, 2nd Floor",
    description: "Self-contained apartment in a gated complex with parking, lift and standby generator.",
    category: "real-estate", subType: "Apartment", district: "Kampala", location: "Muyenga",
    price: 320_000_000, saleInDays: 25, client: "kcb", tags: ["Leasehold", "Residential"],
    photos: ["muyenga-apt-1", "muyenga-apt-2"],
  },
  {
    ref: "DM-2026-0199",
    title: "Residential House on 0.2 Acres",
    description: "Pending verification — not yet visible on the marketplace.",
    category: "real-estate", subType: "Residential House", district: "Mbarara", location: "Kakoba",
    price: 160_000_000, saleInDays: 30, client: "pearl", tags: ["Freehold"], status: "PENDING",
    photos: [],
  },
];

async function main() {
  console.log("Seeding DMAuctionHub sample data…");

  // Remove previously seeded objects from the bucket so re-seeding doesn't leave orphans.
  const oldMedia = await prisma.listingMedia.findMany({ select: { url: true } });
  for (const { url } of oldMedia) {
    if (!/^https?:\/\//i.test(url)) await deleteObject(url);
  }

  // Reset in dependency order (development only).
  await prisma.listingTag.deleteMany();
  await prisma.listingMedia.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.subType.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.client.deleteMany();

  const categoryIds = new Map<string, string>();
  const subTypeIds = new Map<string, string>();
  for (const c of CATEGORIES) {
    const created = await prisma.category.create({
      data: { name: c.name, slug: c.slug, subTypes: { create: c.subTypes.map((name) => ({ name })) } },
      include: { subTypes: true },
    });
    categoryIds.set(c.slug, created.id);
    for (const s of created.subTypes) subTypeIds.set(`${c.slug}:${s.name}`, s.id);
  }

  const tagIds = new Map<string, string>();
  for (const name of TAGS) {
    const t = await prisma.tag.create({ data: { name } });
    tagIds.set(name, t.id);
  }

  const clientIds = new Map<string, string>();
  for (const c of CLIENTS) {
    const created = await prisma.client.create({
      data: { name: c.name, type: c.type, verified: true, phone: c.phone, whatsapp: c.whatsapp, email: c.email },
    });
    clientIds.set(c.key, created.id);
  }

  for (const [index, l] of LISTINGS.entries()) {
    const categoryId = categoryIds.get(l.category);
    const clientId = clientIds.get(l.client);
    if (!categoryId || !clientId) throw new Error(`Bad seed reference in ${l.ref}`);

    const listing = await prisma.listing.create({
      data: {
        referenceId: l.ref,
        title: l.title,
        description: l.description,
        categoryId,
        subTypeId: subTypeIds.get(`${l.category}:${l.subType}`) ?? null,
        district: l.district,
        locationDetail: l.location,
        reservePrice: l.price,
        saleDate: kampalaDate(l.saleInDays, 10),
        deadlineDate: l.deadlineInDays !== undefined ? kampalaDate(l.deadlineInDays, 17) : null,
        inspectionNotes: l.inspection ?? null,
        status: l.status ?? "PUBLISHED",
        isFeatured: l.featured ?? false,
        clientId,
        createdAt: new Date(Date.now() - index * 6 * 60 * 60 * 1000),
        tags: {
          create: l.tags.map((name) => {
            const tagId = tagIds.get(name);
            if (!tagId) throw new Error(`Unknown tag ${name}`);
            return { tagId };
          }),
        },
      },
      select: { id: true },
    });

    for (const [sortOrder, seed] of l.photos.entries()) {
      const body = samplePhotoPng(seed);
      await attachListingMedia({ listingId: listing.id, body, contentType: "image/png", sortOrder });
    }
    if (l.document) {
      const body = sampleNoticePdf([
        "SAMPLE AUCTION NOTICE (development data)",
        `Reference: ${l.ref}`,
        l.title,
        `${l.location}, ${l.district}`,
        "This document is fictional sample data.",
      ]);
      await attachListingMedia({
        listingId: listing.id,
        body,
        contentType: "application/pdf",
        caption: "Auction notice as published (sample PDF)",
      });
    }
    console.log(`  ${l.ref}: ${l.photos.length} photo(s)${l.document ? " + notice PDF" : ""} uploaded to storage`);
  }

  console.log(`Seeded ${CATEGORIES.length} categories, ${TAGS.length} tags, ${CLIENTS.length} clients, ${LISTINGS.length} listings.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
