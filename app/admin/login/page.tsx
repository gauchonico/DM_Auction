import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BadgeCheck, Gavel, ShieldCheck } from "lucide-react";
import { getCurrentStaff } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Staff sign in", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (await getCurrentStaff()) redirect("/admin");
  const raw = (await searchParams).next;
  const next = typeof raw === "string" ? raw : "/admin";

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-card md:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand via-[#0353A4] to-[#0077B6] p-10 text-white md:block">
          <svg className="absolute -right-10 -top-10 h-56 w-56 text-white/10" viewBox="0 0 100 100" aria-hidden>
            <path d="M50 0 C53 40 60 47 100 50 C60 53 53 60 50 100 C47 60 40 53 0 50 C40 47 47 40 50 0Z" fill="currentColor" />
          </svg>
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <Gavel className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="mt-8 text-2xl font-semibold leading-snug tracking-tight">The digital desk for Daily Monitor auction notices</h2>
          <ul className="mt-6 space-y-3 text-sm text-sky-100">
            <li className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-sky-200" aria-hidden /> Verify and publish listings</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-sky-200" aria-hidden /> Every change recorded in the audit log</li>
          </ul>
        </div>

        {/* Form */}
        <div className="p-8 sm:p-10">
          <div className="mb-8 flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white md:hidden">
              <Gavel className="h-5 w-5" aria-hidden />
            </span>
            <div className="leading-tight">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Welcome back</h1>
              <p className="text-sm text-slate-500">Sign in to DMAuctionHub Admin · Nation Media Group staff only</p>
            </div>
          </div>
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
