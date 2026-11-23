import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Hourglass, SearchX } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { getListingByReference } from "@/lib/queries";

/**
 * Permanent short link printed in the newspaper and encoded in QR codes:
 * /a/2026-0142 → /listings/<id>.
 *
 * A printed link must never dead-end:
 * - published or ended → the listing page (it shows its own "auction has closed" banner)
 * - not yet published  → "being verified" holding page (QR can be printed before go-live)
 * - unknown reference  → friendly page with a reference search, never a bare 404
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false } };

interface ShortLinkProps {
  params: Promise<{ ref: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function decodeRef(parts: string[]): string {
  try {
    return parts.map((p) => decodeURIComponent(p)).join("/");
  } catch {
    return parts.join("/");
  }
}

const panel = "mx-auto max-w-xl px-4 py-12 text-center";
const primaryLink = "inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-5 font-semibold text-white hover:bg-brand-light";
const secondaryLink = "inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 font-semibold text-slate-700 hover:border-brand/30 hover:text-brand";

export default async function ShortLinkPage({ params, searchParams }: ShortLinkProps) {
  const reference = decodeRef((await params).ref).slice(0, 64);
  const listing = await getListingByReference(reference);

  if (listing && listing.status !== "PENDING") {
    // Keep the source tag (?s=print, ?s=whatsapp…) for visit counting.
    const source = (await searchParams).s;
    const s = Array.isArray(source) ? source[0] : source;
    redirect(`/listings/${listing.id}${s && /^[a-z0-9_-]{1,24}$/i.test(s) ? `?s=${s}` : ""}`);
  }

  if (listing) {
    return (
      <div className={panel}>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <Hourglass className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">This notice is being verified</h1>
        <p className="mt-2 text-slate-600">
          Notice <strong className="font-semibold text-slate-800">{listing.referenceId}</strong> from{" "}
          <strong className="font-semibold text-slate-800">{listing.client.name}</strong> has been received and will appear here
          shortly with full particulars, photos and contact details. Please check back soon.
        </p>
        <p className="mt-2 text-sm text-slate-500">Auction date: {formatDateTime(listing.saleDate)}</p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/search" className={primaryLink}>Browse live auctions</Link>
          <Link href={`/verify?ref=${encodeURIComponent(listing.referenceId)}`} className={secondaryLink}>Check status again</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={panel}>
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
        <SearchX className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">We couldn&apos;t find that notice</h1>
      <p className="mt-2 text-slate-600">
        No auction matches <strong className="font-semibold text-slate-800">“{reference}”</strong>. Check the reference printed on
        the notice and try again.
      </p>
      <form action="/verify" method="get" className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row">
        <label htmlFor="ref" className="sr-only">Notice reference number</label>
        <input
          id="ref"
          name="ref"
          required
          maxLength={64}
          defaultValue={reference}
          autoCapitalize="characters"
          placeholder="e.g. DM-2026-0142"
          className="min-h-12 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-base uppercase focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
        <button type="submit" className="min-h-12 rounded-xl bg-brand px-6 font-semibold text-white hover:bg-brand-light">
          Find notice
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-500">
        Or <Link href="/search" className="font-semibold text-brand hover:underline">browse all live auctions</Link>.
      </p>
    </div>
  );
}
