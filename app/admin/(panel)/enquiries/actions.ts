"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { bool, str } from "@/lib/admin/form";

export async function setEnquiryHandled(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = str(form, "id", 64);
  const handled = bool(form, "handled");
  const enquiry = await prisma.advertiserEnquiry.findUnique({ where: { id }, select: { organisation: true, handled: true } });
  if (!enquiry || enquiry.handled === handled) return;

  await prisma.$transaction(async (tx) => {
    await tx.advertiserEnquiry.update({ where: { id }, data: { handled } });
    await audit(tx, {
      actor: staff,
      action: handled ? "enquiry.handled" : "enquiry.reopened",
      entityType: "ENQUIRY",
      entityId: id,
      entityLabel: enquiry.organisation,
      summary: handled ? "Marked enquiry as handled" : "Reopened enquiry",
      changes: { handled: { from: enquiry.handled, to: handled } },
    });
  });
  revalidatePath("/admin", "layout");
}
