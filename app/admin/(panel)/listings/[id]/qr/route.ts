import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { qrPng, qrSvg } from "@/lib/qr";
import { shortUrl, shortUrlDisplay } from "@/lib/short-links";

export const dynamic = "force-dynamic";

/**
 * QR code for a listing's permanent short link.
 *   ?format=svg (default) | png
 *   &caption=1   SVG only: print the short link under the code
 *   &download=1  send as an attachment named after the reference
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id }, select: { referenceId: true } });
  if (!listing) return new Response("Listing not found", { status: 404 });

  const query = new URL(request.url).searchParams;
  const format = query.get("format") === "png" ? "png" : "svg";
  const caption = format === "svg" && query.get("caption") === "1";
  const url = shortUrl(listing.referenceId);
  const fileBase = `QR-${listing.referenceId.replace(/[^A-Za-z0-9-]/g, "_")}${caption ? "-with-link" : ""}`;

  const headers: Record<string, string> = { "Cache-Control": "private, no-store" };
  if (query.get("download") === "1") headers["Content-Disposition"] = `attachment; filename="${fileBase}.${format}"`;

  if (format === "png") {
    const png = await qrPng(url);
    return new Response(new Uint8Array(png), { headers: { ...headers, "Content-Type": "image/png" } });
  }
  const svg = qrSvg(url, caption ? shortUrlDisplay(listing.referenceId) : undefined);
  return new Response(svg, { headers: { ...headers, "Content-Type": "image/svg+xml; charset=utf-8" } });
}
