import { AuditEntity, type Prisma } from "@prisma/client";

export const AUDIT_ENTITIES = Object.values(AuditEntity);

export const ENTITY_LABEL: Record<AuditEntity, string> = {
  AUTH: "Sign-in",
  LISTING: "Auction",
  CLIENT: "Client",
  CATEGORY: "Category",
  SUBTYPE: "Sub-type",
  TAG: "Tag",
  ENQUIRY: "Enquiry",
  STAFF: "Staff",
};

export interface AuditFilters {
  entity?: AuditEntity;
  actor?: string; // staff id
  action?: string;
  q?: string;
  from?: string; // YYYY-MM-DD (Kampala)
  to?: string;
  failedLogins?: boolean;
  page: number;
}

type Raw = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim().slice(0, 100) || undefined;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseAuditFilters(raw: Raw): AuditFilters {
  const entity = first(raw.entity);
  const from = first(raw.from);
  const to = first(raw.to);
  const action = first(raw.action);
  return {
    entity: AUDIT_ENTITIES.find((e) => e === entity),
    actor: first(raw.actor),
    action: action && /^[a-z_.]+$/.test(action) ? action : undefined,
    q: first(raw.q),
    from: from && DATE_RE.test(from) ? from : undefined,
    to: to && DATE_RE.test(to) ? to : undefined,
    failedLogins: first(raw.failed) === "1",
    page: Math.max(1, Math.min(10_000, Number(first(raw.page)) || 1)),
  };
}

export function auditWhere(f: AuditFilters): Prisma.AuditLogWhereInput {
  const createdAt: Prisma.DateTimeFilter = {};
  // Date inputs are Kampala calendar days (UTC+3).
  if (f.from) createdAt.gte = new Date(`${f.from}T00:00:00+03:00`);
  if (f.to) createdAt.lt = new Date(new Date(`${f.to}T00:00:00+03:00`).getTime() + 24 * 60 * 60 * 1000);

  return {
    ...(f.entity ? { entityType: f.entity } : {}),
    ...(f.actor ? { actorId: f.actor } : {}),
    ...(f.failedLogins ? { action: "auth.login_failed" } : f.action ? { action: { startsWith: f.action } } : {}),
    ...(f.from || f.to ? { createdAt } : {}),
    ...(f.q
      ? {
          OR: [
            { entityId: f.q },
            { entityLabel: { contains: f.q, mode: "insensitive" } },
            { summary: { contains: f.q, mode: "insensitive" } },
            { actorEmail: { contains: f.q, mode: "insensitive" } },
            { ip: { startsWith: f.q } },
          ],
        }
      : {}),
  };
}

export function auditQueryString(f: AuditFilters, overrides: Partial<Record<keyof AuditFilters, string | number | boolean | undefined>> = {}): string {
  const merged = { ...f, page: undefined, ...overrides } as Record<string, unknown>;
  const sp = new URLSearchParams();
  for (const key of ["entity", "actor", "action", "q", "from", "to", "page"]) {
    const v = merged[key];
    if (v !== undefined && v !== "" && !(key === "page" && Number(v) <= 1)) sp.set(key, String(v));
  }
  if (merged.failedLogins) sp.set("failed", "1");
  return sp.toString();
}

/** Where an audit entry's subject can be viewed in the admin panel, if anywhere. */
export function entityHref(entityType: AuditEntity, entityId: string | null): string | null {
  if (!entityId) return null;
  if (entityType === "LISTING") return `/admin/listings/${entityId}`;
  if (entityType === "CLIENT") return `/admin/clients/${entityId}`;
  if (entityType === "CATEGORY" || entityType === "SUBTYPE" || entityType === "TAG") return "/admin/taxonomy";
  if (entityType === "ENQUIRY") return "/admin/enquiries";
  return null;
}
