import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, Filter, ShieldAlert } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import {
  AUDIT_ENTITIES,
  ENTITY_LABEL,
  auditQueryString,
  auditWhere,
  entityHref,
  parseAuditFilters,
} from "@/lib/admin/audit-query";
import AuditChanges from "@/components/admin/AuditChanges";
import { EmptyRow, PageHeader, buttonSecondary, inputClass, td, th } from "@/components/admin/ui";

export const metadata = { title: "Audit log" };

const PER_PAGE = 50;

const ACTION_TONE: Record<string, string> = {
  delete: "bg-red-100 text-red-900",
  login_failed: "bg-red-100 text-red-900",
  publish: "bg-emerald-100 text-emerald-900",
  create: "bg-sky-100 text-sky-900",
  deactivate: "bg-amber-100 text-amber-900",
  password_reset: "bg-amber-100 text-amber-900",
  role_change: "bg-amber-100 text-amber-900",
};

function actionTone(action: string): string {
  const verb = action.split(".").slice(1).join(".");
  return ACTION_TONE[verb] ?? "bg-slate-100 text-slate-800";
}

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const filters = parseAuditFilters(await searchParams);
  const where = auditWhere(filters);
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [total, entries, staff, failedLast24h] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.staffUser.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, email: true } }),
    prisma.auditLog.count({ where: { action: "auth.login_failed", createdAt: { gte: since24h } } }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const qs = auditQueryString(filters);

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every change made in the admin panel, plus sign-ins. Entries cannot be edited or deleted from the app."
        actions={
          <a href={`/admin/audit/export${qs ? `?${qs}` : ""}`} className={buttonSecondary}>
            <Download className="h-4 w-4" aria-hidden /> Export CSV
          </a>
        }
      />

      {failedLast24h > 0 && !filters.failedLogins && (
        <Link
          href="/admin/audit?failed=1"
          className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900 hover:bg-amber-100"
        >
          <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden />
          {failedLast24h} failed sign-in attempt{failedLast24h === 1 ? "" : "s"} in the last 24 hours — review
        </Link>
      )}

      <form method="get" className="mb-4 grid gap-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-card sm:grid-cols-2 lg:grid-cols-[1fr_10rem_12rem_9rem_9rem_auto]">
        <label className="sr-only" htmlFor="audit-q">Search</label>
        <input id="audit-q" name="q" defaultValue={filters.q} placeholder="Search reference, name, summary, email or IP" className={inputClass} />
        <label className="sr-only" htmlFor="audit-entity">Type</label>
        <select id="audit-entity" name="entity" defaultValue={filters.entity ?? ""} className={inputClass}>
          <option value="">All types</option>
          {AUDIT_ENTITIES.map((e) => <option key={e} value={e}>{ENTITY_LABEL[e]}</option>)}
        </select>
        <label className="sr-only" htmlFor="audit-actor">Staff member</label>
        <select id="audit-actor" name="actor" defaultValue={filters.actor ?? ""} className={inputClass}>
          <option value="">All staff</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <label className="sr-only" htmlFor="audit-from">From date</label>
        <input id="audit-from" name="from" type="date" defaultValue={filters.from} className={inputClass} title="From (Kampala date)" />
        <label className="sr-only" htmlFor="audit-to">To date</label>
        <input id="audit-to" name="to" type="date" defaultValue={filters.to} className={inputClass} title="To (Kampala date)" />
        <div className="flex gap-2">
          <button type="submit" className={buttonSecondary}><Filter className="h-4 w-4" aria-hidden /> Filter</button>
          {qs && <Link href="/admin/audit" className={buttonSecondary}>Clear</Link>}
        </div>
        {filters.action && <input type="hidden" name="action" value={filters.action} />}
        {filters.failedLogins && <input type="hidden" name="failed" value="1" />}
      </form>

      {(filters.action || filters.failedLogins) && (
        <p className="mb-3 text-sm text-slate-600">
          Showing only <code className="rounded bg-slate-100 px-1">{filters.failedLogins ? "auth.login_failed" : filters.action}</code> events ·{" "}
          <Link href={`/admin/audit?${auditQueryString(filters, { action: undefined, failedLogins: false })}`} className="font-semibold text-brand hover:underline">show all actions</Link>
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-card">
        <table className="w-full min-w-[860px]">
          <thead className="border-b border-slate-100 bg-slate-50/70">
            <tr>
              <th className={th}>When (Kampala)</th>
              <th className={th}>Who</th>
              <th className={th}>Action</th>
              <th className={th}>Subject</th>
              <th className={th}>What happened</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.length === 0 && <EmptyRow colSpan={5}>No audit entries match these filters.</EmptyRow>}
            {entries.map((e) => {
              const href = entityHref(e.entityType, e.entityId);
              return (
                <tr key={e.id} className="align-top hover:bg-slate-50">
                  <td className={`${td} whitespace-nowrap text-xs`}>{formatDateTime(e.createdAt)}</td>
                  <td className={`${td} text-xs`}>
                    {e.actorId ? (
                      <Link href={`/admin/audit?actor=${e.actorId}`} className="font-semibold text-brand hover:underline">{e.actorEmail}</Link>
                    ) : (
                      <span className="font-semibold">{e.actorEmail}</span>
                    )}
                    {e.actorRole && <div className="text-slate-500">{e.actorRole.toLowerCase()}</div>}
                  </td>
                  <td className={td}>
                    <Link href={`/admin/audit?action=${encodeURIComponent(e.action)}`} className={`inline-flex rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold ${actionTone(e.action)}`}>
                      {e.action}
                    </Link>
                  </td>
                  <td className={`${td} text-xs`}>
                    <span className="text-slate-500">{ENTITY_LABEL[e.entityType]}</span>
                    <div>
                      {href ? <Link href={href} className="font-semibold text-brand hover:underline">{e.entityLabel ?? e.entityId}</Link> : <span className="font-semibold">{e.entityLabel ?? "—"}</span>}
                    </div>
                  </td>
                  <td className={`${td} max-w-md`}>
                    <p className="text-sm">{e.summary}</p>
                    {(e.changes || e.ip || e.userAgent) && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs font-semibold text-brand">Details</summary>
                        <AuditChanges changes={e.changes} />
                        <p className="mt-2 text-[11px] text-slate-500">
                          {e.ip && <>IP <span className="font-mono">{e.ip}</span> · </>}
                          {e.userAgent && <span className="break-all">{e.userAgent}</span>}
                        </p>
                      </details>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <nav aria-label="Pagination" className="mt-4 flex items-center justify-between">
        {filters.page > 1 ? (
          <Link href={`/admin/audit?${auditQueryString(filters, { page: filters.page - 1 })}`} className={buttonSecondary}><ChevronLeft className="h-4 w-4" aria-hidden /> Newer</Link>
        ) : <span />}
        <span className="text-sm text-slate-600">{total.toLocaleString("en-UG")} entries · page {filters.page} of {pageCount}</span>
        {filters.page < pageCount ? (
          <Link href={`/admin/audit?${auditQueryString(filters, { page: filters.page + 1 })}`} className={buttonSecondary}>Older <ChevronRight className="h-4 w-4" aria-hidden /></Link>
        ) : <span />}
      </nav>
    </>
  );
}
