import Link from "next/link";
import { Gavel, ShieldAlert } from "lucide-react";
import { LEGAL_DISCLAIMER, SITE_NAME } from "@/lib/constants";

const COLUMNS = [
  {
    title: "Marketplace",
    links: [
      { href: "/search", label: "Browse auctions" },
      { href: "/categories", label: "Categories" },
      { href: "/search?category=real-estate", label: "Property auctions" },
      { href: "/search?category=vehicles", label: "Vehicle auctions" },
    ],
  },
  {
    title: "Trust",
    links: [
      { href: "/verify", label: "Verify a notice" },
      { href: "/search?sort=soonest", label: "Closing soon" },
    ],
  },
  {
    title: "Advertisers",
    links: [
      { href: "/advertisers", label: "Advertise with us" },
      { href: "/advertisers#enquiry", label: "Submit a notice" },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-slate-100 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white">
                <Gavel className="h-5 w-5" aria-hidden />
              </span>
              <p className="text-[17px] font-semibold tracking-tight text-slate-900">{SITE_NAME}</p>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500">
              The digital home of auction notices published in the Daily Monitor — verified listings from banks, court
              bailiffs and receivers across Uganda.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <nav key={col.title} aria-label={`Footer — ${col.title}`}>
                <p className="text-sm font-semibold text-slate-900">{col.title}</p>
                <ul className="mt-3 space-y-2.5 text-sm">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link className="text-slate-500 hover:text-brand" href={l.href}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-10 flex gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
          <p className="text-sm leading-relaxed text-slate-600">
            <span className="font-medium text-slate-800">Disclaimer: </span>
            {LEGAL_DISCLAIMER} Buyers should conduct their own due diligence, including a land title search, before bidding.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:justify-between">
          <p>© {year} Nation Media Group Uganda. All rights reserved.</p>
          <p>Photography: Unsplash contributors (Unsplash License)</p>
        </div>
      </div>
    </footer>
  );
}
