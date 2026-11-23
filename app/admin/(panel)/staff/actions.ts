"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { StaffRole } from "@prisma/client";
import { generateTemporaryPassword, hashPassword, requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { EMAIL_RE, FieldErrors, isUniqueViolation, oneOf, str, type FormState } from "@/lib/admin/form";

const ROLES = Object.values(StaffRole);
const BACK = "/admin/staff";

export async function createStaff(_prev: FormState, form: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const errors = new FieldErrors();
  const name = str(form, "name", 120);
  const email = str(form, "email", 160).toLowerCase();
  const role = oneOf(str(form, "role", 10), ROLES);
  if (name.length < 2) errors.add("name", "Enter the person's name.");
  if (!EMAIL_RE.test(email)) errors.add("email", "Enter a valid email address.");
  if (!role) errors.add("role", "Choose a role.");
  if (errors.any || !role) return errors.toState();

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.staffUser.create({ data: { name, email, role, passwordHash } });
      await audit(tx, {
        actor: me,
        action: "staff.create",
        entityType: "STAFF",
        entityId: user.id,
        entityLabel: email,
        summary: `Created ${role.toLowerCase()} account for ${name}`,
        changes: { name: { from: null, to: name }, email: { from: null, to: email }, role: { from: null, to: role } },
      });
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { status: "error", message: "Please correct the highlighted fields.", fieldErrors: { email: "A staff account with this email already exists." } };
    }
    console.error("[admin] createStaff failed", error);
    return { status: "error", message: "Could not create the account. Please try again." };
  }

  revalidatePath(BACK);
  return {
    status: "success",
    message: `Account created for ${email}. Share this temporary password securely — it won't be shown again. They should change it under “My account”.`,
    secret: temporaryPassword,
  };
}

export async function resetStaffPassword(_prev: FormState, form: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const userId = str(form, "userId", 64);
  const user = await prisma.staffUser.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) return { status: "error", message: "This account no longer exists." };

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  await prisma.$transaction(async (tx) => {
    await tx.staffUser.update({ where: { id: userId }, data: { passwordHash } });
    await tx.staffSession.deleteMany({ where: { userId } }); // sign them out everywhere
    await audit(tx, {
      actor: me,
      action: "staff.password_reset",
      entityType: "STAFF",
      entityId: userId,
      entityLabel: user.email,
      summary: "Reset password and signed out all sessions",
    });
  });
  return { status: "success", message: "New temporary password (shown once):", secret: temporaryPassword };
}

async function activeAdminCount(excludingId: string): Promise<number> {
  return prisma.staffUser.count({ where: { role: "ADMIN", active: true, id: { not: excludingId } } });
}

export async function setStaffRole(form: FormData): Promise<void> {
  const me = await requireAdmin();
  const id = str(form, "id", 64);
  const role = oneOf(str(form, "role", 10), ROLES);
  if (!role) redirect(`${BACK}?error=failed`);
  if (id === me.id) redirect(`${BACK}?error=self`);
  if (role === "EDITOR" && (await activeAdminCount(id)) === 0) redirect(`${BACK}?error=last-admin`);

  const user = await prisma.staffUser.findUnique({ where: { id }, select: { email: true, role: true } });
  if (!user) redirect(`${BACK}?error=not-found`);
  if (user.role !== role) {
    await prisma.$transaction(async (tx) => {
      await tx.staffUser.update({ where: { id }, data: { role } });
      await audit(tx, {
        actor: me,
        action: "staff.role_change",
        entityType: "STAFF",
        entityId: id,
        entityLabel: user.email,
        summary: `Changed role from ${user.role.toLowerCase()} to ${role.toLowerCase()}`,
        changes: { role: { from: user.role, to: role } },
      });
    });
  }
  revalidatePath(BACK);
  redirect(`${BACK}?notice=saved`);
}

export async function setStaffActive(form: FormData): Promise<void> {
  const me = await requireAdmin();
  const id = str(form, "id", 64);
  const active = str(form, "active", 5) === "true";
  if (id === me.id) redirect(`${BACK}?error=self`);
  if (!active && (await activeAdminCount(id)) === 0) redirect(`${BACK}?error=last-admin`);

  const user = await prisma.staffUser.findUnique({ where: { id }, select: { email: true, active: true } });
  if (!user) redirect(`${BACK}?error=not-found`);
  if (user.active !== active) {
    await prisma.$transaction(async (tx) => {
      await tx.staffUser.update({ where: { id }, data: { active } });
      if (!active) await tx.staffSession.deleteMany({ where: { userId: id } });
      await audit(tx, {
        actor: me,
        action: active ? "staff.reactivate" : "staff.deactivate",
        entityType: "STAFF",
        entityId: id,
        entityLabel: user.email,
        summary: active ? "Reactivated account" : "Deactivated account and signed out all sessions",
        changes: { active: { from: user.active, to: active } },
      });
    });
  }
  revalidatePath(BACK);
  redirect(`${BACK}?notice=saved`);
}
