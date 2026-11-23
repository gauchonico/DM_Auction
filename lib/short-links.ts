import { SITE_URL } from "@/lib/constants";

/**
 * Permanent short links for print and QR codes: https://<site>/a/<reference>.
 *
 * The path is the notice reference with the house "DM-" prefix dropped
 * (DM-2026-0142 → /a/2026-0142), so it is short to type from a newspaper and makes a
 * low-density QR code that scans reliably on newsprint. These links are printed and
 * cannot be recalled — never change this format, only add to what it accepts.
 */

const HOUSE_PREFIX = "DM-";

export function shortPath(referenceId: string): string {
  const ref = referenceId.toUpperCase();
  const tail = ref.startsWith(HOUSE_PREFIX) ? ref.slice(HOUSE_PREFIX.length) : ref;
  // References may contain "/" (allowed by the admin form); keep it as a path separator.
  return `/a/${tail.split("/").map(encodeURIComponent).join("/")}`;
}

export function shortUrl(referenceId: string): string {
  return `${SITE_URL}${shortPath(referenceId)}`;
}

/** Display form without the scheme, for printing under a QR code: "dmauction.nmgu.ug/a/2026-0142". */
export function shortUrlDisplay(referenceId: string): string {
  return shortUrl(referenceId).replace(/^https?:\/\//, "");
}

/** True when SITE_URL is a temporary address that must not appear in print. */
export function isTemporarySiteUrl(): boolean {
  try {
    const host = new URL(SITE_URL).hostname;
    return host === "localhost" || host === "127.0.0.1" || host.endsWith(".vercel.app");
  } catch {
    return true;
  }
}

/**
 * Every reference a reader might plausibly have meant, from what they typed or scanned.
 * Accepts "2026-0142", "dm-2026-0142", "DM 2026 0142", "DM20260142", "2026-142".
 */
export function referenceCandidates(input: string): string[] {
  const cleaned = input.trim().toUpperCase().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 64);
  if (!cleaned) return [];
  const out = new Set<string>([cleaned]);
  if (!cleaned.startsWith(HOUSE_PREFIX)) out.add(HOUSE_PREFIX + cleaned);

  const m = /^(?:DM-?)?(\d{4})-?(\d{1,6})$/.exec(cleaned);
  if (m) out.add(`${HOUSE_PREFIX}${m[1]}-${m[2].padStart(4, "0")}`);
  return [...out];
}
