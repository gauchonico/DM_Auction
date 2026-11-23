"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ClientType } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { audit, diffFields, initialValues } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/whatsapp";
import { EMAIL_RE, FieldErrors, bool, oneOf, optStr, str, type FormState } from "@/lib/admin/form";

const CLIENT_TYPES = Object.values(ClientType);

export async function saveClient(_prev: FormState, form: FormData): Promise<FormState> {
  const staff = await requireAdmin();
  const clientId = optStr(form, "clientId", 64);
  const errors = new FieldErrors();

  const name = str(form, "name", 160);
  if (name.length < 2) errors.add("name", "Enter the organisation's name.");

  const type = oneOf(str(form, "type", 20), CLIENT_TYPES);
  if (!type) errors.add("type", "Choose a client type.");

  const phoneRaw = optStr(form, "phone", 30);
  if (phoneRaw && !normalizePhone(phoneRaw)) errors.add("phone", "Enter a valid phone number, e.g. 0772 123456.");

  const whatsappRaw = optStr(form, "whatsapp", 30);
  const whatsapp = whatsappRaw ? normalizePhone(whatsappRaw) : null;
  if (whatsappRaw && !whatsapp) errors.add("whatsapp", "Enter a valid WhatsApp number, e.g. 0772 123456.");

  const email = optStr(form, "email", 160)?.toLowerCase() ?? null;
  if (email && !EMAIL_RE.test(email)) errors.add("email", "Enter a valid email address.");

  if (errors.any || !type) return errors.toState();

  const data = { name, type, verified: bool(form, "verified"), phone: phoneRaw, whatsapp, email };

  let id: string;
  try {
    id = await prisma.$transaction(async (tx) => {
      if (clientId) {
        const before = await tx.client.findUnique({
          where: { id: clientId },
          select: { name: true, type: true, verified: true, phone: true, whatsapp: true, email: true },
        });
        if (!before) throw new Error("NOT_FOUND");
        await tx.client.update({ where: { id: clientId }, data });
        const changes = diffFields(before, data);
        const verifiedChange = changes?.verified ? (data.verified ? " — verified" : " — verification removed") : "";
        await audit(tx, {
          actor: staff,
          action: "client.update",
          entityType: "CLIENT",
          entityId: clientId,
          entityLabel: name,
          summary: changes ? `Edited ${Object.keys(changes).join(", ")}${verifiedChange}` : "Saved with no changes",
          changes,
        });
        return clientId;
      }
      const created = await tx.client.create({ data, select: { id: true } });
      await audit(tx, {
        actor: staff,
        action: "client.create",
        entityType: "CLIENT",
        entityId: created.id,
        entityLabel: name,
        summary: `Created client${data.verified ? " (verified)" : ""}`,
        changes: initialValues(data),
      });
      return created.id;
    });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") return { status: "error", message: "This client no longer exists." };
    console.error("[admin] saveClient failed", error);
    return { status: "error", message: "Could not save the client. Please try again." };
  }

  revalidatePath("/admin/clients");
  redirect(`/admin/clients/${id}?notice=${clientId ? "saved" : "created"}`);
}

export async function deleteClient(form: FormData): Promise<void> {
  const staff = await requireAdmin();
  const id = str(form, "id", 64);
  const client = await prisma.client.findUnique({
    where: { id },
    select: { name: true, type: true, verified: true, _count: { select: { listings: true } } },
  });
  if (!client) redirect("/admin/clients?error=not-found");
  if (client._count.listings > 0) redirect(`/admin/clients/${id}?error=in-use`);

  await prisma.$transaction(async (tx) => {
    await tx.client.delete({ where: { id } });
    await audit(tx, {
      actor: staff,
      action: "client.delete",
      entityType: "CLIENT",
      entityId: id,
      entityLabel: client.name,
      summary: "Deleted client",
      changes: { snapshot: { name: client.name, type: client.type, verified: client.verified } },
    });
  });
  revalidatePath("/admin/clients");
  redirect("/admin/clients?notice=deleted");
}
