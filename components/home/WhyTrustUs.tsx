import Image from "next/image";
import Link from "next/link";
import { ArrowRight, FileSearch, MessageCircle, Newspaper, ShieldCheck } from "lucide-react";
import { siteImage } from "@/lib/site-images";

const FEATURES = [
  { icon: Newspaper, title: "From the Daily Monitor", text: "Every listing matches a notice published in print by Nation Media Group.", tone: "bg-brand-50 text-brand" },
  { icon: ShieldCheck, title: "Verified advertisers", text: "Banks, court bailiffs and receivers are checked before their sales go live.", tone: "bg-emerald-50 text-emerald-700" },
  { icon: FileSearch, title: "Check any notice", text: "Enter a reference number to confirm a forwarded notice is genuine.", tone: "bg-violet-50 text-violet-700" },
  { icon: MessageCircle, title: "Talk to the seller", text: "Ask questions and book inspections directly on WhatsApp.", tone: "bg-amber-50 text-amber-700" },
];

/** "Why choose us" (real-estate reference): image + copy on the left, feature cards on the right. */
export default function WhyTrustUs() {
  return (
    <section aria-labelledby="why-heading" className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="grid gap-8 rounded-[32px] bg-slate-50 p-5 sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12 lg:p-12">
        <div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-3xl">
            <Image src={siteImage("gavel")} alt="Auctioneer’s gavel" fill sizes="(max-width: 1024px) 100vw, 520px" quality={60} className="object-cover" />
          </div>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-brand">Why buyers trust us</p>
          <h2 id="why-heading" className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]">
            Your trusted auction partner in Uganda
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate-500">
            Fraudulent “auction” offers are common. We only publish notices we can trace to a verified advertiser and a
            printed Daily Monitor notice.
          </p>
          <Link href="/verify" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-medium text-white shadow-sm hover:bg-brand-light">
            Verify a notice <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, text, tone }) => (
            <li key={title} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_1px_3px_rgba(16,24,40,0.05)]">
              <span className={`grid h-12 w-12 place-items-center rounded-2xl ${tone}`}>
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-5 text-base font-semibold text-slate-900">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
