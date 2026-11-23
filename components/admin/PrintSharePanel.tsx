import { AlertTriangle, Download, Hourglass, QrCode } from "lucide-react";
import type { ListingStatus } from "@prisma/client";
import { isTemporarySiteUrl, shortUrl } from "@/lib/short-links";
import { SITE_URL } from "@/lib/constants";
import { buttonSecondary } from "@/components/admin/ui";
import CopyField from "@/components/admin/CopyField";

/**
 * Print & share: the listing's permanent short link and its QR code for the newspaper
 * notice, social posts and partner platforms.
 */
export default function PrintSharePanel({ listingId, referenceId, status }: { listingId: string; referenceId: string; status: ListingStatus }) {
  const link = shortUrl(referenceId);
  const qrBase = `/admin/listings/${listingId}/qr`;
  const temporary = isTemporarySiteUrl();

  return (
    <section aria-labelledby="print-share-heading" className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
      <div className="flex items-center gap-2">
        <QrCode className="h-5 w-5 text-brand" aria-hidden />
        <h2 id="print-share-heading" className="text-base font-semibold text-slate-900">Print &amp; share</h2>
      </div>

      {temporary && (
        <div role="alert" className="mt-3 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            <strong className="font-semibold">Not for print yet.</strong> Links currently use the temporary address{" "}
            <span className="font-mono">{new URL(SITE_URL).host}</span>. Printed QR codes can&apos;t be changed later, so switch the
            site to its permanent domain before sending any to press. Fine for demos and testing.
          </p>
        </div>
      )}

      <div className="mt-4 grid gap-5 sm:grid-cols-[10rem_1fr]">
        {/* eslint-disable-next-line @next/next/no-img-element -- small admin-only SVG preview */}
        <img
          src={qrBase}
          alt={`QR code linking to ${link}`}
          width={160}
          height={160}
          className="h-40 w-40 rounded-xl border border-slate-100 bg-white p-1"
        />

        <div className="min-w-0 space-y-3">
          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">Short link (permanent: use in print, posts and partner sites)</p>
            <CopyField value={link} label="Short link" />
          </div>

          {status === "PENDING" && (
            <p className="flex gap-2 text-sm text-slate-600">
              <Hourglass className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
              Not published yet. The link and QR already work: readers see “being verified” until you publish.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <a href={`${qrBase}?format=svg&download=1`} className={buttonSecondary}>
              <Download className="h-4 w-4" aria-hidden /> SVG (print)
            </a>
            <a href={`${qrBase}?format=svg&caption=1&download=1`} className={buttonSecondary}>
              <Download className="h-4 w-4" aria-hidden /> SVG with link text
            </a>
            <a href={`${qrBase}?format=png&download=1`} className={buttonSecondary}>
              <Download className="h-4 w-4" aria-hidden /> PNG
            </a>
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            Print at least 2 cm wide and keep the white border around the code. Test-scan one printed proof before the edition runs.
          </p>
        </div>
      </div>
    </section>
  );
}
