"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, type StaffIdentity } from "@/lib/auth";
import { audit, type AuditEntry } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { isUniqueViolation, slugify, str } from "@/lib/admin/form";

const BACK = "/admin/taxonomy";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Runs a change and its audit entry in one transaction, then redirects with a
 * notice. `fn` returns the audit entry describing what it did.
 */
async function run(
  staff: StaffIdentity,
  fn: (tx: Tx) => Promise<Omit<AuditEntry, "actor">>,
  success: string,
): Promise<never> {
  try {
    await prisma.$transaction(async (tx) => {
      const entry = await fn(tx);
      await audit(tx, { ...entry, actor: staff });
    });
  } catch (error) {
    if (isUniqueViolation(error)) redirect(`${BACK}?error=duplicate`);
    if (error instanceof Error && error.message === "NOT_FOUND") redirect(`${BACK}?error=not-found`);
    console.error("[admin] taxonomy action failed", error);
    redirect(`${BACK}?error=failed`);
  }
  revalidatePath(BACK);
  redirect(`${BACK}?notice=${success}`);
}

function validName(name: string): boolean {
  return name.length >= 2 && name.length <= 80;
}

export async function createCategory(form: FormData): Promise<void> {
  const staff = await requireAdmin();
  const name = str(form, "name", 80);
  const slug = slugify(str(form, "slug", 60) || name);
  if (!validName(name) || !slug) redirect(`${BACK}?error=invalid`);
  await run(staff, async (tx) => {
    const c = await tx.category.create({ data: { name, slug } });
    return { action: "category.create", entityType: "CATEGORY", entityId: c.id, entityLabel: name, summary: `Created category (/${slug})`, changes: { name: { from: null, to: name }, slug: { from: null, to: slug } } };
  }, "created");
}

export async function renameCategory(form: FormData): Promise<void> {
  const staff = await requireAdmin();
  const id = str(form, "id", 64);
  const name = str(form, "name", 80);
  if (!validName(name)) redirect(`${BACK}?error=invalid`);
  // The slug is kept stable so existing /search?category= links keep working.
  await run(staff, async (tx) => {
    const before = await tx.category.findUnique({ where: { id }, select: { name: true } });
    if (!before) throw new Error("NOT_FOUND");
    await tx.category.update({ where: { id }, data: { name } });
    return { action: "category.rename", entityType: "CATEGORY", entityId: id, entityLabel: name, summary: `Renamed category “${before.name}” to “${name}”`, changes: { name: { from: before.name, to: name } } };
  }, "saved");
}

export async function deleteCategory(form: FormData): Promise<void> {
  const staff = await requireAdmin();
  const id = str(form, "id", 64);
  if ((await prisma.listing.count({ where: { categoryId: id } })) > 0) redirect(`${BACK}?error=in-use`);
  await run(staff, async (tx) => {
    const c = await tx.category.delete({ where: { id }, include: { subTypes: { select: { name: true } } } });
    return { action: "category.delete", entityType: "CATEGORY", entityId: id, entityLabel: c.name, summary: `Deleted category “${c.name}”`, changes: { snapshot: { name: c.name, slug: c.slug, subTypes: c.subTypes.map((s) => s.name) } } };
  }, "deleted");
}

export async function createSubType(form: FormData): Promise<void> {
  const staff = await requireAdmin();
  const categoryId = str(form, "categoryId", 64);
  const name = str(form, "name", 80);
  if (!validName(name) || !categoryId) redirect(`${BACK}?error=invalid`);
  await run(staff, async (tx) => {
    const s = await tx.subType.create({ data: { name, categoryId }, include: { category: { select: { name: true } } } });
    return { action: "subtype.create", entityType: "SUBTYPE", entityId: s.id, entityLabel: `${s.category.name} › ${name}`, summary: `Added sub-type “${name}” to ${s.category.name}` };
  }, "created");
}

export async function deleteSubType(form: FormData): Promise<void> {
  const staff = await requireAdmin();
  const id = str(form, "id", 64);
  // Listings using it keep their category; their sub-type is cleared (onDelete: SetNull).
  await run(staff, async (tx) => {
    const affected = await tx.listing.count({ where: { subTypeId: id } });
    const s = await tx.subType.delete({ where: { id }, include: { category: { select: { name: true } } } });
    return { action: "subtype.delete", entityType: "SUBTYPE", entityId: id, entityLabel: `${s.category.name} › ${s.name}`, summary: `Deleted sub-type “${s.name}” from ${s.category.name}${affected ? ` (cleared on ${affected} listing(s))` : ""}`, changes: { listingsAffected: affected } };
  }, "deleted");
}

export async function createTag(form: FormData): Promise<void> {
  const staff = await requireAdmin();
  const name = str(form, "name", 60);
  if (!validName(name)) redirect(`${BACK}?error=invalid`);
  await run(staff, async (tx) => {
    const t = await tx.tag.create({ data: { name } });
    return { action: "tag.create", entityType: "TAG", entityId: t.id, entityLabel: name, summary: `Created tag “${name}”` };
  }, "created");
}

export async function deleteTag(form: FormData): Promise<void> {
  const staff = await requireAdmin();
  const id = str(form, "id", 64);
  await run(staff, async (tx) => {
    const affected = await tx.listingTag.count({ where: { tagId: id } });
    const t = await tx.tag.delete({ where: { id } });
    return { action: "tag.delete", entityType: "TAG", entityId: id, entityLabel: t.name, summary: `Deleted tag “${t.name}”${affected ? ` (removed from ${affected} listing(s))` : ""}`, changes: { listingsAffected: affected } };
  }, "deleted");
}
