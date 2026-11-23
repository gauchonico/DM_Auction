import { headers } from "next/headers";
import type { AuditEntity, Prisma, StaffRole } from "@prisma/client";
import { prisma } from "./prisma";

/**
 * Audit trail. Entries are append-only: the app inserts them and never updates
 * or deletes them. Where possible, write the entry with the same transaction
 * client (`tx`) as the change itself so the two succeed or fail together.
 */

export interface AuditActor {
  id: string;
  email: string;
  role: StaffRole;
}

export interface AuditEntry {
  /** Signed-in staff member, or null for anonymous events (failed logins, CLI). */
  actor: AuditActor | null;
  /** Required when actor is null (e.g. the attempted email, or "cli"). */
  actorEmail?: string;
  action: string;
  entityType: AuditEntity;
  entityId?: string | null;
  entityLabel?: string | null;
  summary: string;
  changes?: Record<string, unknown> | null;
}

/** Anything with an `auditLog.create` — the base client or an interactive transaction client. */
export interface AuditWriter {
  auditLog: { create(args: { data: Prisma.AuditLogUncheckedCreateInput }): Promise<unknown> };
}

interface RequestMeta {
  ip: string | null;
  userAgent: string | null;
}

/** IP and user agent of the current request; empty outside a request (CLI scripts). */
async function requestMeta(): Promise<RequestMeta> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = forwarded || h.get("x-real-ip") || null;
    return { ip: ip ? ip.slice(0, 64) : null, userAgent: h.get("user-agent")?.slice(0, 300) ?? null };
  } catch {
    return { ip: null, userAgent: null };
  }
}

function toData(entry: AuditEntry, meta: RequestMeta): Prisma.AuditLogUncheckedCreateInput {
  return {
    actorId: entry.actor?.id ?? null,
    actorEmail: (entry.actor?.email ?? entry.actorEmail ?? "unknown").slice(0, 160),
    actorRole: entry.actor?.role ?? null,
    action: entry.action.slice(0, 64),
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    entityLabel: entry.entityLabel?.slice(0, 200) ?? null,
    summary: entry.summary.slice(0, 500),
    changes: entry.changes ? (entry.changes as Prisma.InputJsonValue) : undefined,
    ip: meta.ip,
    userAgent: meta.userAgent,
  };
}

/** Writes one entry. Pass the transaction client to make it atomic with the change. */
export async function audit(db: AuditWriter, entry: AuditEntry): Promise<void> {
  await db.auditLog.create({ data: toData(entry, await requestMeta()) });
}

/**
 * Best-effort write for events that are not tied to a transaction (logins,
 * uploads to object storage). A logging failure is reported but never blocks
 * the user's action.
 */
export async function auditSafe(entry: AuditEntry): Promise<void> {
  try {
    await audit(prisma, entry);
  } catch (error) {
    console.error(`[audit] failed to record ${entry.action}`, error);
  }
}

export async function auditMany(entries: AuditEntry[]): Promise<void> {
  if (entries.length === 0) return;
  const meta = await requestMeta();
  await prisma.auditLog.createMany({ data: entries.map((e) => toData(e, meta)) });
}

/* ------------------------------------------------------------------ */
/* Field diffs                                                         */
/* ------------------------------------------------------------------ */

const MAX_VALUE_LENGTH = 2000;

/** Normalises values so they compare and serialise predictably. */
function normalise(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((v) => String(v)).sort().join(", ") || null;
  if (typeof value === "number" || typeof value === "boolean") return value;
  const s = String(value); // Prisma.Decimal and anything else
  return s.length > MAX_VALUE_LENGTH ? `${s.slice(0, MAX_VALUE_LENGTH)}…` : s;
}

/** Returns { field: { from, to } } for fields whose values differ, or null if nothing changed. */
export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, { from: unknown; to: unknown }> | null {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(after)) {
    const from = normalise(before[key]);
    const to = normalise(after[key]);
    if (from !== to) changes[key] = { from, to };
  }
  return Object.keys(changes).length > 0 ? changes : null;
}

/** Same as diffFields but records that a new record was created with these values. */
export function initialValues(values: Record<string, unknown>): Record<string, { from: null; to: unknown }> {
  const out: Record<string, { from: null; to: unknown }> = {};
  for (const [key, value] of Object.entries(values)) {
    const v = normalise(value);
    if (v !== null) out[key] = { from: null, to: v };
  }
  return out;
}
