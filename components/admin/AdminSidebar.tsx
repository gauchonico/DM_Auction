"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Building2,
  ExternalLink,
  Gavel,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Tags,
  UserCog,
  Users,
  X,
} from "lucide-react";
import type { StaffRole } from "@prisma/client";
import { logout } from "@/app/admin/auth-actions";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface Props {
  role: StaffRole;
  pendingCount: number;
  openEnquiries: number;
}

/** Active when on the page itself or any page beneath it (e.g. /admin/listings/abc). */
function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminSidebar({ role, pendingCount, openEnquiries }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer after navigating.
  useEffect(() => setOpen(false), [pathname]);

  const sections: { label: string; items: NavItem[] }[] = [
    { label: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
    {
      label: "Manage",
      items: [
        { href: "/admin/listings", label: "Auctions", icon: Gavel, badge: pendingCount },
        { href: "/admin/clients", label: "Clients", icon: Building2 },
        { href: "/admin/taxonomy", label: "Categories & tags", icon: Tags },
        { href: "/admin/enquiries", label: "Enquiries", icon: Inbox, badge: openEnquiries },
      ],
    },
    ...(role === "ADMIN"
      ? [
          {
            label: "Administration",
            items: [
              { href: "/admin/staff", label: "Staff", icon: Users },
              { href: "/admin/audit", label: "Audit log", icon: ScrollText },
            ],
          },
        ]
      : []),
    { label: "Settings", items: [{ href: "/admin/account", label: "My account", icon: UserCog }] },
  ];

  const nav = (
    <nav aria-label="Admin" className="flex-1 space-y-6 overflow-y-auto">
      {sections.map((section) => (
        <div key={section.label}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{section.label}</p>
          <ul className="space-y-1">
            {section.items.map(({ href, label, icon: Icon, badge }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors ${
                      active
                        ? "bg-brand-50 font-semibold text-brand"
                        : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {/* Left accent bar marks the current page. */}
                    <span
                      aria-hidden
                      className={`absolute -left-4 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand transition-opacity ${active ? "opacity-100" : "opacity-0"}`}
                    />
                    <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-brand" : "text-slate-400 group-hover:text-slate-600"}`} />
                    <span className="flex-1">{label}</span>
                    {badge ? (
                      <span
                        className={`min-w-6 rounded-full px-1.5 py-0.5 text-center font-compact text-xs font-semibold tabular-nums ${
                          active ? "bg-brand text-white" : "bg-rose-50 text-rose-700"
                        }`}
                        aria-label={`${badge} need attention`}
                      >
                        {badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="mt-4 space-y-1 border-t border-slate-100 pt-4">
      <Link href="/" target="_blank" className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
        <ExternalLink className="h-[18px] w-[18px] text-slate-400" aria-hidden /> View public site
      </Link>
      <form action={logout}>
        <button type="submit" className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-rose-600 hover:bg-rose-50">
          <LogOut className="h-[18px] w-[18px]" aria-hidden /> Sign out
        </button>
      </form>
    </div>
  );

  const brand = (
    <Link href="/admin" className="flex items-center gap-2.5 px-3">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white shadow-sm">
        <Gavel className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-bold tracking-tight text-slate-900">DMAuctionHub</span>
        <span className="block text-[11px] font-medium text-slate-400">Admin console</span>
      </span>
    </Link>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-100 bg-white px-4 py-6 lg:flex">
        <div className="mb-8">{brand}</div>
        {nav}
        {footer}
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3 lg:hidden">
        {brand}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="grid h-11 w-11 place-items-center rounded-xl text-slate-600 hover:bg-slate-50"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="admin-drawer"
        >
          <Menu className="h-6 w-6" aria-hidden />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" className="absolute inset-0 bg-slate-900/30" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div id="admin-drawer" className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white px-4 py-5 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              {brand}
              <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-50" aria-label="Close menu">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            {nav}
            {footer}
          </div>
        </div>
      )}
    </>
  );
}
