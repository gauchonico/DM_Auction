import Link from "next/link";
import { Bell, Search } from "lucide-react";
import type { StaffIdentity } from "@/lib/auth";
import { Avatar } from "./ui";

/** Search (jumps to the auctions list), enquiry bell, and the signed-in user. */
export default function AdminTopbar({ staff, openEnquiries }: { staff: StaffIdentity; openEnquiries: number }) {
  return (
    <header className="flex items-center gap-3 px-4 pb-2 pt-4 sm:px-6 lg:px-8 lg:pt-6">
      <form action="/admin/listings" method="get" role="search" className="relative min-w-0 flex-1 lg:max-w-xl">
        <label htmlFor="admin-search" className="sr-only">Search auctions</label>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          id="admin-search"
          name="q"
          type="search"
          placeholder="Search auctions by title, reference or district…"
          className="block min-h-11 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
        />
      </form>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <Link
          href="/admin/enquiries"
          className="relative grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          aria-label={openEnquiries ? `${openEnquiries} open enquiries` : "Enquiries"}
        >
          <Bell className="h-[18px] w-[18px]" aria-hidden />
          {openEnquiries > 0 && <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" aria-hidden />}
        </Link>
        <span className="hidden h-8 w-px bg-slate-200 sm:block" aria-hidden />
        <Link href="/admin/account" className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 hover:bg-white">
          <Avatar name={staff.name} />
          <span className="hidden leading-tight sm:block">
            <span className="block text-sm font-semibold text-slate-900">{staff.name}</span>
            <span className="block text-xs text-slate-500">{staff.role === "ADMIN" ? "Administrator" : "Editor"}</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
