import { CalendarCheck, Eye, Search, ShieldCheck } from "lucide-react";
import SectionHeader from "./SectionHeader";

const STEPS = [
  { icon: Search, title: "Find an auction", text: "Search by category, district or price, or browse an advertiser’s portfolio." },
  { icon: ShieldCheck, title: "Verify the notice", text: "Confirm the reference number matches a verified Daily Monitor notice." },
  { icon: Eye, title: "Inspect the asset", text: "Book a viewing with the advertiser and do your due diligence, including a title search." },
  { icon: CalendarCheck, title: "Attend & bid", text: "Register before the deadline and attend the auction on the stated date." },
];

export default function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="mx-auto max-w-7xl px-4 sm:px-6">
      <SectionHeader id="how-heading" eyebrow="How it works" title="Buying at auction, step by step" />
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="relative rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_1px_3px_rgba(16,24,40,0.05)]">
            <span className="absolute right-6 top-6 text-4xl font-semibold tabular-nums text-slate-100" aria-hidden>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-white shadow-sm">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <h3 className="mt-5 text-base font-semibold text-slate-900">
              <span className="sr-only">Step {i + 1}: </span>
              {title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
