import { requireAdmin } from "@/lib/auth";
import { auditSafe } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { auditWhere, parseAuditFilters } from "@/lib/admin/audit-query";

export const dynamic = "force-dynamic";

const MAX_ROWS = 20_000;

/**
 * CSV cell: quoted, with quotes doubled. Cells that start with = + - @ (or tab/CR)
 * are prefixed with ' so spreadsheet apps don't execute them as formulas.
 */
function cell(value: unknown): string {
  let s = value === null || value === undefined ? "" : typeof value === "string" ? value : JSON.stringify(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const staff = await requireAdmin();
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const filters = parseAuditFilters(params);

  const rows = await prisma.auditLog.findMany({
    where: auditWhere(filters),
    orderBy: { createdAt: "desc" },
    take: MAX_ROWS,
  });

  const header = ["time_utc", "actor_email", "actor_role", "action", "entity_type", "entity_id", "entity_label", "summary", "changes", "ip", "user_agent"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [r.createdAt.toISOString(), r.actorEmail, r.actorRole, r.action, r.entityType, r.entityId, r.entityLabel, r.summary, r.changes, r.ip, r.userAgent]
        .map(cell)
        .join(","),
    ),
  ];

  // Exports are themselves audited: they contain staff emails and IP addresses.
  await auditSafe({
    actor: staff,
    action: "audit.export",
    entityType: "STAFF",
    entityId: staff.id,
    entityLabel: staff.email,
    summary: `Exported ${rows.length} audit entries as CSV`,
    changes: { filters: params },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dmauctionhub-audit-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
