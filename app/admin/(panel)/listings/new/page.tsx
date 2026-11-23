import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import ListingForm from "../ListingForm";
import { loadListingFormOptions } from "../options";

export const metadata = { title: "New auction" };

export default async function NewListingPage() {
  const staff = await requireStaff();
  const options = await loadListingFormOptions();

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/listings" className="mb-2 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-brand hover:underline">
        <ChevronLeft className="h-4 w-4" aria-hidden /> Auctions
      </Link>
      <PageHeader title="New auction" description="Photos and documents can be added after the listing is saved." />
      <ListingForm
        listingId={null}
        isAdmin={staff.role === "ADMIN"}
        options={options}
        values={{
          referenceId: "",
          title: "",
          description: "",
          categoryId: "",
          subTypeId: "",
          clientId: "",
          district: "",
          locationDetail: "",
          reservePrice: "",
          saleDate: "",
          deadlineDate: "",
          inspectionNotes: "",
          status: "PENDING",
          isFeatured: false,
          tagIds: [],
        }}
      />
    </div>
  );
}
