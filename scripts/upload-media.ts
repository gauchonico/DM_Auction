/**
 * Attach a photo or notice PDF to a listing, stored in Neon Object Storage.
 *
 *   npm run media:upload -- <REFERENCE_ID> <path/to/file> ["Optional caption"]
 *
 * Staff-only tool: uploads require the branch's storage credentials, so there
 * is deliberately no unauthenticated upload endpoint in the web app.
 */
import { readFile } from "node:fs/promises";
import { hostname, userInfo } from "node:os";
import { basename, extname } from "node:path";
import { auditSafe } from "../lib/audit";
import { resolveMediaUrl } from "../lib/media-url";
import { prisma } from "../lib/prisma";
import { attachListingMedia } from "../lib/storage";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".pdf": "application/pdf",
};

async function main() {
  const [reference, filePath, caption] = process.argv.slice(2);
  if (!reference || !filePath) {
    throw new Error('Usage: npm run media:upload -- <REFERENCE_ID> <file> ["caption"]');
  }

  const contentType = CONTENT_TYPES[extname(filePath).toLowerCase()];
  if (!contentType) throw new Error(`Unsupported file extension: ${extname(filePath) || "(none)"}`);

  const listing = await prisma.listing.findUnique({
    where: { referenceId: reference },
    select: { id: true, title: true, _count: { select: { media: true } } },
  });
  if (!listing) throw new Error(`No listing with reference ${reference}`);

  const body = new Uint8Array(await readFile(filePath));
  const media = await attachListingMedia({
    listingId: listing.id,
    body,
    contentType,
    caption: caption ?? null,
    sortOrder: listing._count.media,
  });

  await auditSafe({
    actor: null,
    actorEmail: `cli (${userInfo().username}@${hostname()})`,
    action: "listing.media_upload",
    entityType: "LISTING",
    entityId: listing.id,
    entityLabel: reference,
    summary: `Uploaded ${media.type === "IMAGE" ? "photo" : "document"} “${basename(filePath)}” from the command line`,
    changes: { file: basename(filePath), size: body.byteLength, type: contentType, key: media.url, caption: caption ?? null },
  });

  console.log(`Uploaded ${media.type} for "${listing.title}"`);
  console.log(`  key: ${media.url}`);
  console.log(`  url: ${resolveMediaUrl(media.url)}`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
