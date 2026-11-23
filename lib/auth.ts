import { createHash, randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { StaffRole } from "@prisma/client";
import { prisma } from "./prisma";

/* ------------------------------------------------------------------ */
/* Passwords (scrypt, per-password salt, self-describing format)       */
/* ------------------------------------------------------------------ */

const SCRYPT = { N: 16384, r: 8, p: 1, keyLen: 64 } as const;
export const MIN_PASSWORD_LENGTH = 10;

function scryptAsync(password: string, salt: Buffer, keyLen: number, opts: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password, salt, keyLen, opts, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, SCRYPT.keyLen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, n, r, p, saltB64, keyB64] = stored.split("$");
  if (algo !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64");
  const actual = await scryptAsync(password, Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Used when no user matches, so a failed login takes the same time either way. */
const DUMMY_HASH = "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" + Buffer.alloc(64).toString("base64");
export async function burnPasswordCheck(password: string): Promise<void> {
  await verifyPassword(password, DUMMY_HASH);
}

/** Readable temporary password, e.g. for new staff or resets (shown to the admin once). */
export function generateTemporaryPassword(): string {
  return randomBytes(12).toString("base64url");
}

export function validateNewPassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (password.length > 200) return "Password is too long.";
  return null;
}

/* ------------------------------------------------------------------ */
/* Sessions                                                            */
/* ------------------------------------------------------------------ */

export const SESSION_COOKIE = "dmah_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // one working day

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Creates a session and sets the cookie. Call only from a Server Action or Route Handler. */
export async function startSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.staffSession.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  await prisma.staffUser.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  // Opportunistic cleanup of expired sessions.
  await prisma.staffSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await prisma.staffSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}

export async function revokeAllSessions(userId: string, exceptCurrent = false): Promise<void> {
  const token = exceptCurrent ? (await cookies()).get(SESSION_COOKIE)?.value : undefined;
  await prisma.staffSession.deleteMany({
    where: { userId, ...(token ? { tokenHash: { not: hashToken(token) } } : {}) },
  });
}

export interface StaffIdentity {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
}

/** The signed-in staff member for this request, or null. Cached per request. */
export const getCurrentStaff = cache(async (): Promise<StaffIdentity | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const session = await prisma.staffSession.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { expiresAt: true, user: { select: { id: true, email: true, name: true, role: true, active: true } } },
  });
  if (!session || session.expiresAt < new Date() || !session.user.active) return null;
  const { active: _active, ...identity } = session.user;
  return identity;
});

/**
 * Guards every admin page and every admin Server Action. Server Actions are
 * public HTTP endpoints, so each one must call this itself.
 */
export async function requireStaff(): Promise<StaffIdentity> {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/login");
  return staff;
}

export async function requireAdmin(): Promise<StaffIdentity> {
  const staff = await requireStaff();
  if (staff.role !== "ADMIN") redirect("/admin?error=forbidden");
  return staff;
}

/* ------------------------------------------------------------------ */
/* Login throttling (per email, per server instance)                   */
/* ------------------------------------------------------------------ */

const MAX_FAILURES = 5;
const LOCK_WINDOW_MS = 15 * 60 * 1000;
const failures = new Map<string, { count: number; first: number }>();

export function isLoginLocked(email: string): boolean {
  const entry = failures.get(email);
  if (!entry) return false;
  if (Date.now() - entry.first > LOCK_WINDOW_MS) {
    failures.delete(email);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

export function recordLoginFailure(email: string): void {
  const entry = failures.get(email);
  if (!entry || Date.now() - entry.first > LOCK_WINDOW_MS) failures.set(email, { count: 1, first: Date.now() });
  else entry.count += 1;
}

export function clearLoginFailures(email: string): void {
  failures.delete(email);
}
