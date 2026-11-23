import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { siteImage } from "@/lib/site-images";

/** Closing call-to-action banner (real-estate reference) with the city skyline image. */
export default function CtaBanner() {
  return (
    <section aria-labelledby="cta-heading" className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="relative isolate overflow-hidden rounded-[32px] bg-gradient-to-br from-brand via-[#0353A4] to-[#0077B6] px-6 py-12 text-white sm:px-12 lg:py-16">
        <div className="absolute inset-y-0 right-0 -z-10 hidden w-1/2 lg:block" aria-hidden>
          <Image src={siteImage("city")} alt="" fill sizes="640px" quality={60} className="object-cover" />
          <span className="absolute inset-0 bg-gradient-to-r from-[#0353A4] via-[#0353A4]/60 to-transparent" />
        </div>
        <div className="max-w-lg">
          <h2 id="cta-heading" className="text-2xl font-semibold leading-tight tracking-tight sm:text-[32px]">
            Have assets to auction? Reach serious buyers across Uganda.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-sky-100">
            Banks, bailiffs and receivers: publish your Daily Monitor notice online with photos, documents and direct
            WhatsApp enquiries.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/advertisers#enquiry" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 text-sm font-medium text-brand hover:bg-brand-50">
              Advertise with us <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/search" className="inline-flex min-h-12 items-center rounded-xl px-6 text-sm font-medium text-white ring-1 ring-white/30 hover:bg-white/10">
              Browse auctions
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
