import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, CircleAlert, CircleX, ShieldCheck } from "lucide-react";
import { SELLER_BADGE } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { getListingByReference } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verify an Auction Notice",
  description: "Check that a printed or forwarded auction notice is a genuine, verified DMAuctionHub listing.",
};

interface VerifyPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type Lookup = Awaited<ReturnType<typeof getListingByReference>>;

function Result({ reference, listing }: { reference: string; listing: Lookup }) {
  if (!listing) {
    return (
      <div role="status" className="mt-6 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
        <CircleX className="h-6 w-6 shrink-0 text-red-600" aria-hidden />
        <div>
          <p className="font-semibold text-red-900">No verified notice found for “{reference}”</p>
          <p className="mt-1 text-sm text-red-800">
            Check the reference printed on the notice and try again. If someone is asking you to pay for a property that is
            not listed here, treat it with caution and do not send money before confirming with the advertiser directly.
          </p>
        </div>
      </div>
    );
  }

  if (listing.status === "PENDING") {
    return (
      <div role="status" className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <CircleAlert className="h-6 w-6 shrink-0 text-amber-600" aria-hidden />
        <div>
          <p className="font-semibold text-amber-900">Notice {listing.referenceId} is awaiting verification</p>
          <p className="mt-1 text-sm text-amber-800">It has been received but not yet published. Please check again later.</p>
        </div>
      </div>
    );
  }

  const expired = listing.status === "EXPIRED";
  return (
    <div role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex gap-3">
        <BadgeCheck className="h-6 w-6 shrink-0 text-emerald-600" aria-hidden />
        <div className="min-w-0">
          <p className="font-semibold text-emerald-900">
            Genuine notice{expired ? " (auction closed)" : ""} — Ref {listing.referenceId}
          </p>
          <dl className="mt-2 grid gap-1 text-sm text-emerald-900">
            <div><dt className="inline font-semibold">Asset: </dt><dd className="inline">{listing.title}</dd></div>
            <div><dt className="inline font-semibold">District: </dt><dd className="inline">{listing.district}</dd></div>
            <div><dt className="inline font-semibold">Auction: </dt><dd className="inline">{formatDateTime(listing.saleDate)}</dd></div>
            <div>
              <dt className="inline font-semibold">Advertiser: </dt>
              <dd className="inline">
                {listing.client.name} ({SELLER_BADGE[listing.client.type].label}
                {listing.client.verified ? ", verified" : ""})
              </dd>
            </div>
          </dl>
          <Link
            href={`/listings/${listing.id}`}
            className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-white"
          >
            View full listing
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const raw = (await searchParams).ref;
  const reference = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 64) ?? "";
  const listing = reference ? await getListingByReference(reference) : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <ShieldCheck className="h-10 w-10 text-brand" aria-hidden />
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Verify an auction notice</h1>
      <p className="mt-1 text-slate-600">
        Enter the reference number printed on the Daily Monitor notice (for example <code className="rounded bg-slate-100 px-1">DM-2026-0142</code>)
        to confirm it is a genuine, verified advertisement.
      </p>

      <form action="/verify" method="get" className="mt-6 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="ref" className="sr-only">Notice reference number</label>
        <input
          id="ref"
          name="ref"
          required
          maxLength={64}
          defaultValue={reference}
          autoCapitalize="characters"
          placeholder="Reference number"
          className="min-h-12 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-base uppercase focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
        <button type="submit" className="min-h-12 rounded-xl bg-brand px-6 font-semibold text-white hover:bg-brand-light">
          Verify
        </button>
      </form>

      {reference && <Result reference={reference} listing={listing} />}
    </div>
  );
}
