import type { ClientType, ListingStatus } from "@prisma/client";
import { BadgeCheck, Clock, Star } from "lucide-react";
import { SELLER_BADGE } from "@/lib/constants";
import { daysUntil } from "@/lib/format";

export function SellerBadge({ type, className = "" }: { type: ClientType; className?: string }) {
  const badge = SELLER_BADGE[type];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.className} ${className}`}
    >
      {badge.label}
    </span>
  );
}

interface StatusBadgeProps {
  status: ListingStatus;
  isFeatured: boolean;
  deadlineDate: Date | null;
  saleDate: Date;
}

/** Single most-relevant status chip for a listing. */
export function StatusBadge({ status, isFeatured, deadlineDate, saleDate }: StatusBadgeProps) {
  const base = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm";

  if (status === "EXPIRED" || daysUntil(saleDate) < 0) {
    return <span className={`${base} bg-slate-800/90 text-white`}>Closed</span>;
  }
  if (status === "PENDING") {
    return <span className={`${base} bg-white/95 text-slate-700`}>Pending</span>;
  }

  const closingDate = deadlineDate ?? saleDate;
  const remaining = daysUntil(closingDate);
  if (remaining <= 3) {
    return (
      <span className={`${base} bg-amber-400 text-slate-900`}>
        <Clock className="h-3 w-3" aria-hidden />
        {remaining <= 0 ? "Closes today" : `Closes in ${remaining}d`}
      </span>
    );
  }
  if (isFeatured) {
    return (
      <span className={`${base} bg-white/95 text-brand`}>
        <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
        Featured
      </span>
    );
  }
  return (
    <span className={`${base} bg-emerald-600 text-white`}>
      <BadgeCheck className="h-3 w-3" aria-hidden />
      Verified
    </span>
  );
}
