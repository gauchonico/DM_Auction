/**
 * Create (or reset) an ADMIN account from the command line — used to bootstrap
 * the first admin, or to recover access if every admin is locked out.
 *
 *   npm run admin:create -- you@example.com "Your Name"
 *
 * A random temporary password is printed once; change it under "My account".
 */
import { hostname, userInfo } from "node:os";
import { generateTemporaryPassword, hashPassword } from "../lib/auth";
import { audit } from "../lib/audit";
import { EMAIL_RE } from "../lib/admin/form";
import { prisma } from "../lib/prisma";

async function main() {
  const [emailArg, ...nameParts] = process.argv.slice(2);
  const email = (emailArg ?? "").trim().toLowerCase();
  const name = nameParts.join(" ").trim();
  if (!EMAIL_RE.test(email) || name.length < 2) {
    throw new Error('Usage: npm run admin:create -- <email> "<Full Name>"');
  }

  const password = generateTemporaryPassword();
  const passwordHash = await hashPassword(password);
  const existing = await prisma.staffUser.findUnique({ where: { email }, select: { id: true } });

  await prisma.$transaction(async (tx) => {
    const user = await tx.staffUser.upsert({
      where: { email },
      create: { email, name, role: "ADMIN", passwordHash },
      update: { name, role: "ADMIN", active: true, passwordHash },
    });
    if (existing) await tx.staffSession.deleteMany({ where: { userId: user.id } });
    await audit(tx, {
      actor: null,
      actorEmail: `cli (${userInfo().username}@${hostname()})`,
      action: existing ? "staff.cli_reset" : "staff.cli_create",
      entityType: "STAFF",
      entityId: user.id,
      entityLabel: email,
      summary: existing
        ? "Reset to ADMIN with a new password from the command line"
        : "Created admin account from the command line",
    });
  });

  console.log(`${existing ? "Reset" : "Created"} admin account: ${email}`);
  console.log(`Temporary password (shown once): ${password}`);
  console.log("Sign in at /admin/login and change it under “My account”.");
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
