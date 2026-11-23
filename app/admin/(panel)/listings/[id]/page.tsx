import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronLeft, ExternalLink, Star, Trash2, Undo2 } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toNumber, formatDateTime } from "@/lib/format";
import { toKampalaInput } from "@/lib/admin/form";
import { ConfirmButton, SubmitButton } from "@/components/admin/buttons";
import { Notice, PageHeader, StatusPill, buttonDanger, buttonPrimary, buttonSecondary } from "@/components/admin/ui";
import AuditHistory from "@/components/admin/AuditHistory";
import ListingForm from "../ListingForm";
import MediaManager from "../MediaManager";
import { loadListingFormOptions } from "../options";
import { deleteListing, setListingStatus, toggleFeatured } from "../actions";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id }, select: { referenceId: true } });
  return { title: listing ? `Edit ${listing.referenceId}` : "Listing not found" };
}

function StatusAction({ id, status, label, icon: Icon, className }: { id: string; status: string; label: string; icon: typeof CheckCircle2; className: string }) {
  return (
    <form action={setListingStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton className={className}>
        <Icon className="h-4 w-4" aria-hidden /> {label}
      </SubmitButton>
    </form>
  );
}

export default async function EditListingPage({ params, searchParams }: PageProps) {
  const staff = await requireStaff();
  const { id } = await params;
  const query = await searchParams;
  const isAdmin = staff.role === "ADMIN";

  const [listing, options] = await Promise.all([
    prisma.listing.findUnique({
      where: { id },
      include: {
        tags: { select: { tagId: true } },
        media: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }], select: { id: true, url: true, type: true, caption: true } },
        client: { select: { name: true } },
      },
    }),
    loadListingFormOptions(),
  ]);
  if (!listing) notFound();

  const price = toNumber(listing.reservePrice);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link href="/admin/listings" className="mb-2 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-brand hover:underline">
          <ChevronLeft className="h-4 w-4" aria-hidden /> Auctions
        </Link>
        <PageHeader
          title={listing.title}
          description={`${listing.referenceId} · ${listing.client.name} · Auction ${formatDateTime(listing.saleDate)} · Last updated ${formatDateTime(listing.updatedAt)}`}
          actions={
            listing.status !== "PENDING" && (
              <Link href={`/listings/${listing.id}`} target="_blank" className={buttonSecondary}>
                <ExternalLink className="h-4 w-4" aria-hidden /> View on site
              </Link>
            )
          }
        />
        <Notice code={query.error ?? query.notice} />

        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-card">
          <span className="text-sm font-semibold text-slate-700">Status:</span>
          <StatusPill status={listing.status} />
          {listing.isFeatured && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">
              <Star className="h-3.5 w-3.5 fill-current" aria-hidden /> Featured
            </span>
          )}
          {isAdmin && (
            <div className="ml-auto flex flex-wrap gap-2">
              {listing.status !== "PUBLISHED" && (
                <StatusAction id={listing.id} status="PUBLISHED" label="Publish" icon={CheckCircle2} className={buttonPrimary} />
              )}
              {listing.status === "PUBLISHED" && (
                <StatusAction id={listing.id} status="PENDING" label="Unpublish" icon={Undo2} className={buttonSecondary} />
              )}
              <form action={toggleFeatured}>
                <input type="hidden" name="id" value={listing.id} />
                <SubmitButton className={buttonSecondary}>
                  <Star className="h-4 w-4" aria-hidden /> {listing.isFeatured ? "Unfeature" : "Feature"}
                </SubmitButton>
              </form>
              <form action={deleteListing}>
                <input type="hidden" name="id" value={listing.id} />
                <ConfirmButton className={buttonDanger} message={`Delete ${listing.referenceId} and all its photos and documents? This cannot be undone.`}>
                  <Trash2 className="h-4 w-4" aria-hidden /> Delete
                </ConfirmButton>
              </form>
            </div>
          )}
        </div>
      </div>

      <MediaManager listingId={listing.id} media={listing.media} />

      <ListingForm
        listingId={listing.id}
        isAdmin={isAdmin}
        options={options}
        values={{
          referenceId: listing.referenceId,
          title: listing.title,
          description: listing.description,
          categoryId: listing.categoryId,
          subTypeId: listing.subTypeId ?? "",
          clientId: listing.clientId,
          district: listing.district,
          locationDetail: listing.locationDetail ?? "",
          reservePrice: price === null ? "" : String(price),
          saleDate: toKampalaInput(listing.saleDate),
          deadlineDate: toKampalaInput(listing.deadlineDate),
          inspectionNotes: listing.inspectionNotes ?? "",
          status: listing.status,
          isFeatured: listing.isFeatured,
          tagIds: listing.tags.map((t) => t.tagId),
        }}
      />

      <AuditHistory entityType="LISTING" entityId={listing.id} showFullLogLink={isAdmin} />
    </div>
  );
}
