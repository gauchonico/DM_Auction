"use server";

import { hashPassword, requireStaff, revokeAllSessions, validateNewPassword, verifyPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { FieldErrors, type FormState } from "@/lib/admin/form";

function raw(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.slice(0, 200) : "";
}

export async function changePassword(_prev: FormState, form: FormData): Promise<FormState> {
  const me = await requireStaff();
  const errors = new FieldErrors();
  const current = raw(form, "current");
  const next = raw(form, "next");
  const confirm = raw(form, "confirm");

  const problem = validateNewPassword(next);
  if (problem) errors.add("next", problem);
  if (next !== confirm) errors.add("confirm", "The passwords don't match.");
  if (next && next === current) errors.add("next", "Choose a password different from your current one.");

  const user = await prisma.staffUser.findUnique({ where: { id: me.id }, select: { passwordHash: true } });
  if (!user || !(await verifyPassword(current, user.passwordHash))) errors.add("current", "Your current password is incorrect.");
  if (errors.any) return errors.toState();

  const passwordHash = await hashPassword(next);
  await prisma.$transaction(async (tx) => {
    await tx.staffUser.update({ where: { id: me.id }, data: { passwordHash } });
    await audit(tx, { actor: me, action: "auth.password_change", entityType: "STAFF", entityId: me.id, entityLabel: me.email, summary: "Changed own password; other sessions signed out" });
  });
  await revokeAllSessions(me.id, true); // keep this session, sign out everywhere else
  return { status: "success", message: "Password changed. Other devices have been signed out." };
}
