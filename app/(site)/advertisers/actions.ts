"use server";

import { ClientType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/whatsapp";

export interface EnquiryState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"organisation" | "contactName" | "phone" | "email" | "clientType" | "message", string>>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function text(form: FormData, key: string, max: number): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function submitAdvertiserEnquiry(_prev: EnquiryState, form: FormData): Promise<EnquiryState> {
  // Honeypot: real users never fill this hidden field.
  if (text(form, "website", 200)) return { status: "success", message: "Thank you — we'll be in touch." };

  const organisation = text(form, "organisation", 160);
  const contactName = text(form, "contactName", 120);
  const phoneRaw = text(form, "phone", 30);
  const email = text(form, "email", 160);
  const clientTypeRaw = text(form, "clientType", 20);
  const message = text(form, "message", 2000);

  const fieldErrors: EnquiryState["fieldErrors"] = {};
  if (organisation.length < 2) fieldErrors.organisation = "Enter your organisation's name.";
  if (contactName.length < 2) fieldErrors.contactName = "Enter a contact person.";
  const phone = normalizePhone(phoneRaw);
  if (!phone) fieldErrors.phone = "Enter a valid phone number, e.g. 0772 123456.";
  if (email && !EMAIL_RE.test(email)) fieldErrors.email = "Enter a valid email address.";
  const clientType = Object.values(ClientType).find((t) => t === clientTypeRaw);
  if (!clientType) fieldErrors.clientType = "Select your organisation type.";
  if (message.length < 10) fieldErrors.message = "Tell us briefly what you'd like to advertise.";

  if (Object.keys(fieldErrors).length > 0 || !phone || !clientType) {
    return { status: "error", message: "Please correct the highlighted fields.", fieldErrors };
  }

  try {
    await prisma.advertiserEnquiry.create({
      data: { organisation, contactName, phone, email: email || null, clientType, message },
    });
  } catch (error) {
    console.error("[advertiser enquiry] failed to save", error);
    return { status: "error", message: "We couldn't send your enquiry right now. Please try again shortly." };
  }

  return {
    status: "success",
    message: "Thank you — your enquiry has been received. A Nation Media Group advertising executive will contact you.",
  };
}
