import Link from "next/link";
import { Check, Mail, MessageCircle, Phone, RotateCcw } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SELLER_BADGE } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { buildWhatsAppLink, telLink } from "@/lib/whatsapp";
import { SubmitButton } from "@/components/admin/buttons";
import { PageHeader, buttonSmall } from "@/components/admin/ui";
import { setEnquiryHandled } from "./actions";

export const metadata = { title: "Enquiries" };

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireStaff();
  const view = (await searchParams).view === "handled" ? "handled" : "open";
  const enquiries = await prisma.advertiserEnquiry.findMany({
    where: { handled: view === "handled" },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <PageHeader title="Advertiser enquiries" description="Leads submitted from the “For Advertisers” page." />
      <nav className="mb-4 flex gap-2" aria-label="Enquiry filter">
        {(["open", "handled"] as const).map((v) => (
          <Link
            key={v}
            href={v === "open" ? "/admin/enquiries" : "/admin/enquiries?view=handled"}
            aria-current={view === v ? "page" : undefined}
            className={`inline-flex min-h-9 items-center rounded-full px-3 text-sm font-semibold ${view === v ? "bg-brand text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}
          >
            {v === "open" ? "Open" : "Handled"}
          </Link>
        ))}
      </nav>

      {enquiries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          {view === "open" ? "No open enquiries." : "No handled enquiries yet."}
        </p>
      ) : (
        <ul className="space-y-3">
          {enquiries.map((e) => {
            const tel = telLink(e.phone);
            const wa = buildWhatsAppLink(e.phone, `Hello ${e.contactName}, thank you for your enquiry about advertising on DMAuctionHub Uganda.`);
            return (
              <li key={e.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900">{e.organisation}</p>
                    <p className="text-xs text-slate-500">
                      {SELLER_BADGE[e.clientType].label} · {e.contactName} · {formatDateTime(e.createdAt)}
                    </p>
                  </div>
                  <form action={setEnquiryHandled}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="handled" value={e.handled ? "false" : "true"} />
                    <SubmitButton className={buttonSmall}>
                      {e.handled ? <><RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reopen</> : <><Check className="h-3.5 w-3.5" aria-hidden /> Mark handled</>}
                    </SubmitButton>
                  </form>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{e.message}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
                  {tel && <a href={tel} className="inline-flex items-center gap-1 text-brand hover:underline"><Phone className="h-4 w-4" aria-hidden /> {e.phone}</a>}
                  {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-whatsapp-dark hover:underline"><MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp</a>}
                  {e.email && <a href={`mailto:${e.email}`} className="inline-flex items-center gap-1 text-brand hover:underline"><Mail className="h-4 w-4" aria-hidden /> {e.email}</a>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
