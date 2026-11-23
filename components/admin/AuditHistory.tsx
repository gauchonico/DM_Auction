import Link from "next/link";
import type { AuditEntity } from "@prisma/client";
import { History } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import AuditChanges from "./AuditChanges";
import { Card } from "./ui";

/** Recent audit entries for one record, shown on its edit page. */
export default async function AuditHistory({
  entityType,
  entityId,
  showFullLogLink,
}: {
  entityType: AuditEntity;
  entityId: string;
  showFullLogLink: boolean;
}) {
  const entries = await prisma.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: { id: true, createdAt: true, actorEmail: true, actorRole: true, summary: true, changes: true },
  });

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <History className="h-4 w-4" aria-hidden /> History
        </h2>
        {showFullLogLink && (
          <Link href={`/admin/audit?entity=${entityType}&q=${encodeURIComponent(entityId)}`} className="text-xs font-semibold text-brand hover:underline">
            Full audit log
          </Link>
        )}
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">No recorded changes yet.</p>
      ) : (
        <ol className="space-y-3">
          {entries.map((e) => (
            <li key={e.id} className="border-l-2 border-slate-200 pl-3">
              <p className="text-sm text-slate-900">{e.summary}</p>
              <p className="text-xs text-slate-500">
                {formatDateTime(e.createdAt)} · {e.actorEmail}
                {e.actorRole ? ` (${e.actorRole.toLowerCase()})` : ""}
              </p>
              {e.changes && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-xs font-semibold text-brand">Details</summary>
                  <AuditChanges changes={e.changes} />
                </details>
              )}
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
