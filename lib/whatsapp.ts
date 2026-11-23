import { SITE_URL } from "./constants";

/**
 * Normalises Ugandan phone numbers to the international digits-only form that
 * wa.me expects, e.g. "0772 123 456" -> "256772123456".
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return null;
  if (digits.startsWith("256") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `256${digits.slice(1)}`;
  if (digits.length === 9 && /^[37]/.test(digits)) return `256${digits}`;
  // Already international for another country code; accept if plausible E.164 length.
  if (digits.length >= 10 && digits.length <= 15) return digits;
  return null;
}

/** Client's WhatsApp number, falling back to the platform desk number when configured. */
export function resolveWhatsAppNumber(clientWhatsApp: string | null | undefined): string | null {
  return normalizePhone(clientWhatsApp) ?? normalizePhone(process.env.WHATSAPP_FALLBACK_NUMBER);
}

export function buildWhatsAppLink(number: string | null, message: string): string | null {
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function listingEnquiryMessage(listing: { id: string; title: string; referenceId: string }): string {
  return [
    `Hello, I am enquiring about the auction listing on DMAuctionHub Uganda:`,
    `${listing.title}`,
    `Ref: ${listing.referenceId}`,
    `${SITE_URL}/listings/${listing.id}`,
  ].join("\n");
}

export function listingWhatsAppLink(
  listing: { id: string; title: string; referenceId: string },
  clientWhatsApp: string | null | undefined,
): string | null {
  return buildWhatsAppLink(resolveWhatsAppNumber(clientWhatsApp), listingEnquiryMessage(listing));
}

export function telLink(raw: string | null | undefined): string | null {
  const n = normalizePhone(raw);
  return n ? `tel:+${n}` : null;
}
