import type { ClientType } from "@prisma/client";

export const SITE_NAME = "DMAuctionHub Uganda";
export const SITE_TAGLINE = "A Nation Media Group Service";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const LEGAL_DISCLAIMER =
  "DMAuctionHub is an advertising and discovery marketplace. All listings are verified advertisements and do not constitute legal certification of title.";

/** Districts offered in filters, merged at runtime with districts present in the data. */
export const UGANDA_DISTRICTS = [
  "Kampala",
  "Wakiso",
  "Mukono",
  "Gulu",
  "Jinja",
  "Mbarara",
  "Masaka",
  "Mbale",
  "Lira",
  "Arua",
  "Kabarole",
  "Hoima",
  "Kasese",
  "Mityana",
  "Luweero",
  "Mpigi",
  "Buikwe",
  "Tororo",
  "Soroti",
  "Kabale",
] as const;

export const SELLER_BADGE: Record<ClientType, { label: string; className: string }> = {
  BANK: { label: "Bank Repossessed", className: "bg-brand text-white" },
  BAILIFF: { label: "Court Bailiff", className: "bg-accent text-white" },
  RECEIVER: { label: "Receiver Sale", className: "bg-amber-500 text-slate-950" },
  PRIVATE: { label: "Private Seller", className: "bg-slate-700 text-white" },
};

export const CLIENT_GROUPS: { type: ClientType; heading: string }[] = [
  { type: "BANK", heading: "Banks & Financial Institutions" },
  { type: "BAILIFF", heading: "Court Bailiffs & Auctioneers" },
  { type: "RECEIVER", heading: "Receivers & Managers" },
  { type: "PRIVATE", heading: "Private Sellers" },
];

export const PAGE_SIZE = 12;
