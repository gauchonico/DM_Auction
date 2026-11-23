import { getLatestListings, type ListingCardData } from "@/lib/queries";
import ListingCard from "./ListingCard";
import SectionError, { EmptyState } from "./SectionError";

export default async function LatestListingsGrid({ limit = 8 }: { limit?: number }) {
  let listings: ListingCardData[];
  try {
    listings = await getLatestListings(limit);
  } catch (error) {
    console.error("[LatestListingsGrid] failed to load listings", error);
    return <SectionError message="We couldn't load the latest auctions right now. Please refresh in a moment." />;
  }

  if (listings.length === 0) {
    return (
      <EmptyState title="No upcoming auctions yet">
        New verified notices are added every day after they appear in the Daily Monitor.
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
