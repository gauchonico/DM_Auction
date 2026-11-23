import type { Metadata } from "next";
import { BadgeCheck, MessageCircle, Newspaper, Smartphone } from "lucide-react";
import AdvertiserEnquiryForm from "@/components/AdvertiserEnquiryForm";

export const metadata: Metadata = {
  title: "For Advertisers",
  description:
    "Extend your Daily Monitor auction notices online. Reach serious buyers across Uganda with verified digital listings and WhatsApp enquiries.",
};

const BENEFITS = [
  {
    icon: Newspaper,
    title: "Print + digital in one booking",
    text: "Every notice you place in the Daily Monitor can be published here with photos, documents and full particulars.",
  },
  {
    icon: BadgeCheck,
    title: "Verified trust badge",
    text: "Listings carry your verified status so buyers can tell genuine sales from fraudulent offers.",
  },
  {
    icon: MessageCircle,
    title: "Direct WhatsApp leads",
    text: "Buyers contact your team straight from the listing on WhatsApp, with the notice reference included.",
  },
  {
    icon: Smartphone,
    title: "Built for mobile data",
    text: "Lightweight pages load quickly on 3G connections, so your sale reaches buyers across the country.",
  },
];

export default function AdvertisersPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Advertise your auctions</h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        For banks, court bailiffs, receivers and liquidators: extend the reach of your statutory notices and convert
        interest into bids faster.
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {BENEFITS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900">{title}</h2>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </div>
          </li>
        ))}
      </ul>

      <section id="enquiry" aria-labelledby="enquiry-heading" className="mt-10 scroll-mt-20 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 id="enquiry-heading" className="text-xl font-semibold tracking-tight text-slate-900">Talk to our advertising team</h2>
        <p className="mb-5 mt-1 text-sm text-slate-600">Tell us about your upcoming sales and we&apos;ll get back to you.</p>
        <AdvertiserEnquiryForm />
      </section>
    </div>
  );
}
