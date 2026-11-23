"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  burnPasswordCheck,
  clearLoginFailures,
  endSession,
  getCurrentStaff,
  isLoginLocked,
  recordLoginFailure,
  startSession,
  verifyPassword,
} from "@/lib/auth";
import { auditSafe } from "@/lib/audit";
import { str, type FormState } from "@/lib/admin/form";

/** Only allow redirects back into the admin panel (prevents open redirects). */
function safeNext(value: string): string {
  return value.startsWith("/admin") && !value.startsWith("//") && !value.includes("\\") ? value : "/admin";
}

const GENERIC_ERROR = "Incorrect email or password.";

async function logFailure(email: string, reason: string, userId?: string) {
  await auditSafe({
    actor: null,
    actorEmail: email || "(blank)",
    action: "auth.login_failed",
    entityType: "AUTH",
    entityId: userId ?? null,
    entityLabel: email,
    summary: `Failed sign-in for ${email || "(blank)"}: ${reason}`,
    changes: { reason },
  });
}

export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  const email = str(form, "email", 160).toLowerCase();
  const password = typeof form.get("password") === "string" ? (form.get("password") as string).slice(0, 200) : "";
  const next = safeNext(str(form, "next", 300));

  if (!email || !password) return { status: "error", message: "Enter your email and password." };
  if (isLoginLocked(email)) {
    await logFailure(email, "locked out after repeated failures");
    return { status: "error", message: "Too many failed attempts. Wait 15 minutes and try again." };
  }

  const user = await prisma.staffUser.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, passwordHash: true, active: true },
  });

  if (!user) {
    await burnPasswordCheck(password);
    recordLoginFailure(email);
    await logFailure(email, "no such account");
    return { status: "error", message: GENERIC_ERROR };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid || !user.active) {
    recordLoginFailure(email);
    await logFailure(email, valid ? "account deactivated" : "wrong password", user.id);
    return { status: "error", message: valid ? "This account has been deactivated." : GENERIC_ERROR };
  }

  clearLoginFailures(email);
  await startSession(user.id);
  await auditSafe({
    actor: { id: user.id, email: user.email, role: user.role },
    action: "auth.login",
    entityType: "AUTH",
    entityId: user.id,
    entityLabel: user.email,
    summary: `Signed in`,
  });
  redirect(next);
}

export async function logout(): Promise<void> {
  const staff = await getCurrentStaff();
  await endSession();
  if (staff) {
    await auditSafe({ actor: staff, action: "auth.logout", entityType: "AUTH", entityId: staff.id, entityLabel: staff.email, summary: "Signed out" });
  }
  redirect("/admin/login");
}
