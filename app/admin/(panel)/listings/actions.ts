"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, type ListingStatus } from "@prisma/client";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { audit, auditMany, auditSafe, diffFields, initialValues } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { kampalaStartOfToday } from "@/lib/format";
import { ALLOWED_MEDIA, attachListingMedia, deleteObject } from "@/lib/storage";
import {
  FieldErrors,
  bool,
  isUniqueViolation,
  kampalaDateTime,
  money,
  oneOf,
  optStr,
  str,
  strList,
  type FormState,
} from "@/lib/admin/form";

const STATUSES = ["PENDING", "PUBLISHED", "EXPIRED"] as const;
const STATUS_VERB: Record<ListingStatus, string> = { PUBLISHED: "Published", PENDING: "Unpublished (moved to pending)", EXPIRED: "Marked as expired" };

/** Human-readable snapshot of a listing for audit diffs (names, not IDs). */
interface ListingAuditView {
  reference: string;
  title: string;
  description: string;
  category: string | null;
  subType: string | null;
  client: string | null;
  district: string;
  location: string | null;
  reservePrice: string | null;
  saleDate: Date;
  deadline: Date | null;
  inspection: string | null;
  status: ListingStatus;
  featured: boolean;
  tags: string[];
}

/* ------------------------------------------------------------------ */
/* Create / update                                                     */
/* ------------------------------------------------------------------ */

// Record IDs travel as hidden form fields rather than `.bind()` arguments: a bound
// action that returns state hangs when the form is submitted before JS loads.
export async function saveListing(_prev: FormState, form: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const listingId = optStr(form, "listingId", 64);
  const isAdmin = staff.role === "ADMIN";
  const errors = new FieldErrors();

  const existing = listingId
    ? await prisma.listing.findUnique({
        where: { id: listingId },
        select: {
          id: true,
          referenceId: true,
          title: true,
          description: true,
          district: true,
          locationDetail: true,
          reservePrice: true,
          saleDate: true,
          deadlineDate: true,
          inspectionNotes: true,
          status: true,
          isFeatured: true,
          category: { select: { name: true } },
          subType: { select: { name: true } },
          client: { select: { name: true } },
          tags: { select: { tag: { select: { name: true } } } },
        },
      })
    : null;
  if (listingId && !existing) return { status: "error", message: "This listing no longer exists." };

  const referenceId = str(form, "referenceId", 40).toUpperCase();
  if (!referenceId) errors.add("referenceId", "Required — use the reference printed on the notice.");
  else if (!/^[A-Z0-9][A-Z0-9/-]{2,39}$/.test(referenceId)) errors.add("referenceId", "Use letters, numbers, - or / only.");

  const title = str(form, "title", 200);
  if (title.length < 5) errors.add("title", "Enter a descriptive title (at least 5 characters).");

  const description = str(form, "description", 10_000);
  if (description.length < 20) errors.add("description", "Describe the asset (at least 20 characters).");

  const district = str(form, "district", 60);
  if (!district) errors.add("district", "Required.");

  const categoryId = str(form, "categoryId", 64);
  const subTypeId = optStr(form, "subTypeId", 64);
  const clientId = str(form, "clientId", 64);
  const tagIds = strList(form, "tagIds");

  const reservePrice = money(form, "reservePrice", errors);
  const saleDate = kampalaDateTime(form, "saleDate", errors, true);
  const deadlineDate = kampalaDateTime(form, "deadlineDate", errors, false);
  if (saleDate && deadlineDate && deadlineDate > saleDate) {
    errors.add("deadlineDate", "The deadline must be on or before the auction date.");
  }

  // Referenced records must exist (and the sub-type must belong to the category).
  const [category, subType, client, tags] = await Promise.all([
    categoryId ? prisma.category.findUnique({ where: { id: categoryId }, select: { name: true } }) : null,
    subTypeId ? prisma.subType.findUnique({ where: { id: subTypeId }, select: { categoryId: true, name: true } }) : null,
    clientId ? prisma.client.findUnique({ where: { id: clientId }, select: { name: true } }) : null,
    tagIds.length ? prisma.tag.findMany({ where: { id: { in: tagIds } }, select: { name: true } }) : [],
  ]);
  if (!category) errors.add("categoryId", "Choose a category.");
  if (subTypeId && (!subType || subType.categoryId !== categoryId)) errors.add("subTypeId", "Choose a sub-type from the selected category.");
  if (!client) errors.add("clientId", "Choose the advertiser.");
  if (tags.length !== tagIds.length) errors.add("tagIds", "One or more tags no longer exist.");

  // Editors can never publish: every editor save goes (back) to review.
  let status: ListingStatus = "PENDING";
  if (isAdmin) status = oneOf(str(form, "status", 20), STATUSES) ?? existing?.status ?? "PENDING";
  const isFeatured = isAdmin ? bool(form, "isFeatured") : existing?.isFeatured ?? false;

  if (errors.any || !saleDate) return errors.toState();

  const data = {
    referenceId,
    title,
    description,
    categoryId,
    subTypeId,
    clientId,
    district,
    locationDetail: optStr(form, "locationDetail", 200),
    reservePrice: reservePrice === null ? null : new Prisma.Decimal(reservePrice),
    saleDate,
    deadlineDate,
    inspectionNotes: optStr(form, "inspectionNotes", 4000),
    status,
    isFeatured,
  };

  const after: ListingAuditView = {
    reference: referenceId,
    title,
    description,
    category: category?.name ?? null,
    subType: subType?.name ?? null,
    client: client?.name ?? null,
    district,
    location: data.locationDetail,
    reservePrice: reservePrice === null ? null : String(reservePrice),
    saleDate,
    deadline: deadlineDate,
    inspection: data.inspectionNotes,
    status,
    featured: isFeatured,
    tags: tags.map((t) => t.name),
  };
  const before: ListingAuditView | null = existing && {
    reference: existing.referenceId,
    title: existing.title,
    description: existing.description,
    category: existing.category.name,
    subType: existing.subType?.name ?? null,
    client: existing.client.name,
    district: existing.district,
    location: existing.locationDetail,
    reservePrice: existing.reservePrice === null ? null : existing.reservePrice.toFixed(0),
    saleDate: existing.saleDate,
    deadline: existing.deadlineDate,
    inspection: existing.inspectionNotes,
    status: existing.status,
    featured: existing.isFeatured,
    tags: existing.tags.map((t) => t.tag.name),
  };

  let id: string;
  try {
    id = await prisma.$transaction(async (tx) => {
      const saved = existing
        ? await tx.listing.update({ where: { id: existing.id }, data, select: { id: true } })
        : await tx.listing.create({ data, select: { id: true } });
      await tx.listingTag.deleteMany({ where: { listingId: saved.id } });
      if (tagIds.length) {
        await tx.listingTag.createMany({ data: tagIds.map((tagId) => ({ listingId: saved.id, tagId })) });
      }

      if (before) {
        const changes = diffFields({ ...before }, { ...after });
        const backToReview = !isAdmin && before.status !== "PENDING";
        await audit(tx, {
          actor: staff,
          action: "listing.update",
          entityType: "LISTING",
          entityId: saved.id,
          entityLabel: referenceId,
          summary: changes
            ? `Edited ${Object.keys(changes).join(", ")}${backToReview ? " — returned to review" : ""}`
            : "Saved with no changes",
          changes,
        });
      } else {
        await audit(tx, {
          actor: staff,
          action: "listing.create",
          entityType: "LISTING",
          entityId: saved.id,
          entityLabel: referenceId,
          summary: `Created listing (${status.toLowerCase()})`,
          changes: initialValues({ ...after }),
        });
      }
      return saved.id;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { status: "error", message: "Please correct the highlighted fields.", fieldErrors: { referenceId: "Another listing already uses this reference." } };
    }
    console.error("[admin] saveListing failed", error);
    return { status: "error", message: "Could not save the listing. Please try again." };
  }

  revalidatePath("/admin", "layout");
  const notice = !isAdmin ? "submitted" : existing ? "saved" : "created";
  redirect(`/admin/listings/${id}?notice=${notice}`);
}

/* ------------------------------------------------------------------ */
/* Admin-only quick actions                                            */
/* ------------------------------------------------------------------ */

export async function setListingStatus(form: FormData): Promise<void> {
  const staff = await requireAdmin();
  const id = str(form, "id", 64);
  const status = oneOf(str(form, "status", 20), STATUSES);
  const back = str(form, "back", 300).startsWith("/admin") ? str(form, "back", 300) : `/admin/listings/${id}`;
  if (!id || !status) redirect(back);

  const listing = await prisma.listing.findUnique({ where: { id }, select: { referenceId: true, status: true } });
  if (!listing) redirect("/admin/listings?error=not-found");

  if (listing.status !== status) {
    await prisma.$transaction(async (tx) => {
      await tx.listing.update({ where: { id }, data: { status } });
      await audit(tx, {
        actor: staff,
        action: status === "PUBLISHED" ? "listing.publish" : status === "EXPIRED" ? "listing.expire" : "listing.unpublish",
        entityType: "LISTING",
        entityId: id,
        entityLabel: listing.referenceId,
        summary: STATUS_VERB[status],
        changes: { status: { from: listing.status, to: status } },
      });
    });
  }

  revalidatePath("/admin", "layout");
  const notice = status === "PUBLISHED" ? "published" : status === "EXPIRED" ? "expired" : "unpublished";
  redirect(`${back}${back.includes("?") ? "&" : "?"}notice=${notice}`);
}

export async function toggleFeatured(form: FormData): Promise<void> {
  const staff = await requireAdmin();
  const id = str(form, "id", 64);
  const listing = await prisma.listing.findUnique({ where: { id }, select: { isFeatured: true, referenceId: true } });
  if (!listing) redirect("/admin/listings?error=not-found");
  await prisma.$transaction(async (tx) => {
    await tx.listing.update({ where: { id }, data: { isFeatured: !listing.isFeatured } });
    await audit(tx, {
      actor: staff,
      action: listing.isFeatured ? "listing.unfeature" : "listing.feature",
      entityType: "LISTING",
      entityId: id,
      entityLabel: listing.referenceId,
      summary: listing.isFeatured ? "Removed from featured" : "Marked as featured",
      changes: { featured: { from: listing.isFeatured, to: !listing.isFeatured } },
    });
  });
  redirect(`/admin/listings/${id}?notice=saved`);
}

export async function deleteListing(form: FormData): Promise<void> {
  const staff = await requireAdmin();
  const id = str(form, "id", 64);
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { referenceId: true, title: true, status: true, saleDate: true, client: { select: { name: true } }, media: { select: { url: true } } },
  });
  if (!listing) redirect("/admin/listings?error=not-found");

  await prisma.$transaction(async (tx) => {
    await tx.listing.delete({ where: { id } });
    await audit(tx, {
      actor: staff,
      action: "listing.delete",
      entityType: "LISTING",
      entityId: id,
      entityLabel: listing.referenceId,
      summary: `Deleted listing “${listing.title}” and ${listing.media.length} file(s)`,
      changes: {
        snapshot: { title: listing.title, client: listing.client.name, status: listing.status, saleDate: listing.saleDate.toISOString() },
      },
    });
  });

  // Remove stored files after the rows are gone; failures only leave orphans, never broken listings.
  await Promise.all(
    listing.media
      .filter((m) => !/^https?:\/\//i.test(m.url))
      .map((m) => deleteObject(m.url).catch((e) => console.error(`[admin] could not delete object ${m.url}`, e))),
  );
  revalidatePath("/admin", "layout");
  redirect("/admin/listings?notice=deleted");
}

export async function expirePastListings(): Promise<void> {
  const staff = await requireAdmin();
  const where = { status: "PUBLISHED" as const, saleDate: { lt: kampalaStartOfToday() } };
  const targets = await prisma.listing.findMany({ where, select: { id: true, referenceId: true } });
  await prisma.listing.updateMany({ where: { id: { in: targets.map((t) => t.id) } }, data: { status: "EXPIRED" } });
  await auditMany(
    targets.map((t) => ({
      actor: staff,
      action: "listing.expire",
      entityType: "LISTING" as const,
      entityId: t.id,
      entityLabel: t.referenceId,
      summary: `Marked as expired (bulk: ${targets.length} past auctions)`,
      changes: { status: { from: "PUBLISHED", to: "EXPIRED" } },
    })),
  );
  revalidatePath("/admin", "layout");
  redirect("/admin/listings?notice=expired-batch");
}

/* ------------------------------------------------------------------ */
/* Media (photos and notice PDFs in Neon Object Storage)               */
/* ------------------------------------------------------------------ */

export async function uploadMedia(_prev: FormState, form: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const listingId = str(form, "listingId", 64);
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, referenceId: true, _count: { select: { media: true } } },
  });
  if (!listing) return { status: "error", message: "This listing no longer exists." };

  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { status: "error", message: "Choose at least one photo or PDF." };
  if (files.length > 10) return { status: "error", message: "Upload at most 10 files at a time." };

  const caption = optStr(form, "caption", 200);
  const problems: string[] = [];
  let uploaded = 0;

  for (const [i, file] of files.entries()) {
    const spec = ALLOWED_MEDIA[file.type];
    if (!spec) {
      problems.push(`${file.name}: unsupported type (use JPG, PNG, WebP, AVIF or PDF)`);
      continue;
    }
    if (file.size > spec.maxBytes) {
      problems.push(`${file.name}: too large (max ${Math.round(spec.maxBytes / 1024 / 1024)} MB)`);
      continue;
    }
    try {
      const media = await attachListingMedia({
        listingId,
        body: new Uint8Array(await file.arrayBuffer()),
        contentType: file.type,
        caption,
        sortOrder: listing._count.media + i,
      });
      uploaded += 1;
      await auditSafe({
        actor: staff,
        action: "listing.media_upload",
        entityType: "LISTING",
        entityId: listingId,
        entityLabel: listing.referenceId,
        summary: `Uploaded ${media.type === "IMAGE" ? "photo" : "document"} “${file.name.slice(0, 120)}”`,
        changes: { file: file.name.slice(0, 200), size: file.size, type: file.type, key: media.url, caption },
      });
    } catch (error) {
      console.error("[admin] upload failed", error);
      problems.push(`${file.name}: upload failed`);
    }
  }

  revalidatePath(`/admin/listings/${listingId}`);
  if (problems.length) {
    return {
      status: uploaded ? "success" : "error",
      message: `${uploaded} uploaded. ${problems.join("; ")}.`,
    };
  }
  return { status: "success", message: `${uploaded} file${uploaded === 1 ? "" : "s"} uploaded.` };
}

export async function deleteMedia(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = str(form, "mediaId", 64);
  const media = await prisma.listingMedia.findUnique({
    where: { id },
    select: { url: true, type: true, caption: true, listingId: true, listing: { select: { referenceId: true } } },
  });
  if (!media) redirect("/admin/listings?error=not-found");

  await prisma.$transaction(async (tx) => {
    await tx.listingMedia.delete({ where: { id } });
    await audit(tx, {
      actor: staff,
      action: "listing.media_delete",
      entityType: "LISTING",
      entityId: media.listingId,
      entityLabel: media.listing.referenceId,
      summary: `Deleted ${media.type === "IMAGE" ? "photo" : "document"}${media.caption ? ` “${media.caption}”` : ""}`,
      changes: { key: media.url, caption: media.caption },
    });
  });
  if (!/^https?:\/\//i.test(media.url)) {
    await deleteObject(media.url).catch((e) => console.error(`[admin] could not delete object ${media.url}`, e));
  }
  revalidatePath(`/admin/listings/${media.listingId}`);
}

/** Moves a photo one place up or down within its listing (re-numbers sortOrder). */
export async function moveMedia(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = str(form, "mediaId", 64);
  const direction = str(form, "direction", 4) === "up" ? -1 : 1;
  const media = await prisma.listingMedia.findUnique({
    where: { id },
    select: { listingId: true, type: true, listing: { select: { referenceId: true } } },
  });
  if (!media) return;

  const siblings = await prisma.listingMedia.findMany({
    where: { listingId: media.listingId, type: media.type },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  const index = siblings.findIndex((s) => s.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= siblings.length) return;

  [siblings[index], siblings[target]] = [siblings[target], siblings[index]];
  await prisma.$transaction(async (tx) => {
    for (const [sortOrder, s] of siblings.entries()) {
      await tx.listingMedia.update({ where: { id: s.id }, data: { sortOrder } });
    }
    await audit(tx, {
      actor: staff,
      action: "listing.media_reorder",
      entityType: "LISTING",
      entityId: media.listingId,
      entityLabel: media.listing.referenceId,
      summary: `Moved a ${media.type === "IMAGE" ? "photo" : "document"} from position ${index + 1} to ${target + 1}${target === 0 && media.type === "IMAGE" ? " (new cover)" : ""}`,
      changes: { position: { from: index + 1, to: target + 1 } },
    });
  });
  revalidatePath(`/admin/listings/${media.listingId}`);
}
