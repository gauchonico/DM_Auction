import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin | DMAuctionHub" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const [pendingCount, openEnquiries] = await Promise.all([
    prisma.listing.count({ where: { status: "PENDING" } }),
    prisma.advertiserEnquiry.count({ where: { handled: false } }),
  ]);

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <AdminSidebar role={staff.role} pendingCount={pendingCount} openEnquiries={openEnquiries} />
      <div className="min-w-0 flex-1">
        <AdminTopbar staff={staff} openEnquiries={openEnquiries} />
        <main className="px-4 pb-10 pt-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
