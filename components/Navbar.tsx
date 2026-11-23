import Link from "next/link";
import { Gavel, Menu, ShieldCheck, X } from "lucide-react";
import { SITE_TAGLINE } from "@/lib/constants";

const NAV_LINKS = [
  { href: "/search", label: "Browse auctions" },
  { href: "/categories", label: "Categories" },
  { href: "/advertisers", label: "For advertisers" },
] as const;

function Brand() {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="DMAuctionHub Uganda — home">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-sm">
        <Gavel className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-[17px] font-semibold tracking-tight text-slate-900">
          DMAuctionHub <span className="font-medium text-brand">Uganda</span>
        </span>
        <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-slate-500">
          <ShieldCheck className="h-3 w-3 text-emerald-600" aria-hidden />
          {SITE_TAGLINE}
        </span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Brand />

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/verify"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:border-brand/30 hover:text-brand"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Verify notice
          </Link>
          <Link href="/advertisers#enquiry" className="inline-flex min-h-10 items-center rounded-full bg-brand px-5 text-sm font-medium text-white shadow-sm hover:bg-brand-light">
            Advertise with us
          </Link>
        </div>

        {/* Zero-JS mobile menu using <details>. */}
        <details className="group md:hidden">
          <summary
            className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-xl text-slate-700 hover:bg-slate-50 [&::-webkit-details-marker]:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6 group-open:hidden" aria-hidden />
            <X className="hidden h-6 w-6 group-open:block" aria-hidden />
          </summary>
          <nav aria-label="Mobile" className="absolute inset-x-0 top-[68px] border-b border-slate-100 bg-white px-4 pb-5 pt-2 shadow-lg">
            <ul className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="flex min-h-12 items-center border-b border-slate-100 text-base font-medium text-slate-700">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href="/verify" className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-200 text-sm font-medium text-slate-700">
                <ShieldCheck className="h-4 w-4" aria-hidden /> Verify notice
              </Link>
              <Link href="/advertisers#enquiry" className="flex min-h-12 items-center justify-center rounded-full bg-brand text-sm font-medium text-white">
                Advertise
              </Link>
            </div>
          </nav>
        </details>
      </div>
    </header>
  );
}
