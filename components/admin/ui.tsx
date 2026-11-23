import type { ListingStatus, StaffRole } from "@prisma/client";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

/* Design tokens for the admin panel: company blue #023E8A, soft canvas, rounded white cards. */

export const inputClass =
  "block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-red-100";

export const buttonPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-light focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 disabled:opacity-60";
export const buttonSecondary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/10 disabled:opacity-60";
export const buttonDanger =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60";
export const buttonSmall =
  "inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/* Pastel colour chips (Coursue-style). Each tone pairs a light fill with an accessible ink. */
export const TONES = {
  blue: "bg-brand-50 text-brand",
  sky: "bg-sky-50 text-sky-700",
  violet: "bg-violet-50 text-violet-700",
  amber: "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
  rose: "bg-rose-50 text-rose-700",
  slate: "bg-slate-100 text-slate-600",
} as const;
export type Tone = keyof typeof TONES;

export function IconChip({ icon: Icon, tone = "blue", size = "md" }: { icon: React.ComponentType<{ className?: string }>; tone?: Tone; size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "h-12 w-12 rounded-2xl" : size === "sm" ? "h-8 w-8 rounded-lg" : "h-10 w-10 rounded-xl";
  const glyph = size === "lg" ? "h-6 w-6" : size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <span className={`grid shrink-0 place-items-center ${box} ${TONES[tone]}`} aria-hidden>
      <Icon className={glyph} />
    </span>
  );
}

const AVATAR_TONES: Tone[] = ["blue", "sky", "violet", "amber", "emerald", "rose"];

/** Initials avatar with a stable pastel colour per name. */
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .replace(/\(.*?\)/g, "")
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const tone = AVATAR_TONES[hash % AVATAR_TONES.length];
  const dims = size === "lg" ? "h-12 w-12 text-base" : size === "sm" ? "h-8 w-8 text-[11px]" : "h-9 w-9 text-xs";
  return (
    <span className={`grid shrink-0 place-items-center rounded-full font-semibold ${dims} ${TONES[tone]}`} aria-hidden>
      {initials || "?"}
    </span>
  );
}

export function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-slate-800">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

const NOTICES: Record<string, { tone: "success" | "error"; text: string }> = {
  saved: { tone: "success", text: "Changes saved." },
  created: { tone: "success", text: "Created successfully." },
  deleted: { tone: "success", text: "Deleted." },
  published: { tone: "success", text: "Listing published — it is now live on the site." },
  unpublished: { tone: "success", text: "Listing moved back to pending." },
  expired: { tone: "success", text: "Listing marked as expired." },
  submitted: { tone: "success", text: "Saved and submitted for review. An admin must publish it before it goes live." },
  "expired-batch": { tone: "success", text: "Past auctions have been marked as expired." },
  forbidden: { tone: "error", text: "That action needs an admin account." },
  "in-use": { tone: "error", text: "This item is still used by listings and can't be deleted." },
  "not-found": { tone: "error", text: "That item no longer exists." },
  "upload-failed": { tone: "error", text: "Upload failed. Check the file type and size and try again." },
  duplicate: { tone: "error", text: "That name (or URL slug) is already in use." },
  invalid: { tone: "error", text: "Enter a name between 2 and 80 characters." },
  failed: { tone: "error", text: "Something went wrong. Please try again." },
  "last-admin": { tone: "error", text: "There must always be at least one active admin." },
  self: { tone: "error", text: "You can't change your own role or deactivate yourself." },
};

/** Flash message driven by ?notice= or ?error= search params after a redirect. */
export function Notice({ code }: { code?: string | string[] }) {
  const key = Array.isArray(code) ? code[0] : code;
  const notice = key ? NOTICES[key] : undefined;
  if (!notice) return null;
  const success = notice.tone === "success";
  const Icon = success ? CheckCircle2 : AlertTriangle;
  return (
    <div
      role={success ? "status" : "alert"}
      className={`mb-4 flex items-start gap-2 rounded-xl border p-3 text-sm font-medium ${
        success ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      {notice.text}
    </div>
  );
}

/* Status pills (Brightly-style): soft fill + coloured dot + text label, so state is never colour-alone. */
const STATUS_STYLE: Record<ListingStatus, { pill: string; dot: string; label: string }> = {
  PENDING: { pill: "bg-amber-50 text-amber-800", dot: "bg-amber-500", label: "Pending" },
  PUBLISHED: { pill: "bg-emerald-50 text-emerald-800", dot: "bg-emerald-500", label: "Published" },
  EXPIRED: { pill: "bg-slate-100 text-slate-600", dot: "bg-slate-400", label: "Expired" },
};

export function StatusPill({ status }: { status: ListingStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 font-compact text-xs font-semibold ${s.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
      {s.label}
    </span>
  );
}

export function RolePill({ role }: { role: StaffRole }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-compact text-xs font-semibold ${
        role === "ADMIN" ? "bg-brand-50 text-brand" : "bg-violet-50 text-violet-700"
      }`}
    >
      {role === "ADMIN" ? "Admin" : "Editor"}
    </span>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-slate-500">
        {children}
      </td>
    </tr>
  );
}

/* Dense data tables use IBM Plex Sans with tabular figures so numbers and dates line up. */
export const tableWrap = "overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-card";
export const theadRow = "border-b border-slate-100 bg-slate-50/70";
export const th = "px-4 py-3 text-left font-data text-xs font-medium text-slate-500";
export const td = "px-4 py-3 align-top font-data text-sm tabular-nums text-slate-700";
