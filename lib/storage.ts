import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { MediaType } from "@prisma/client";
import { MEDIA_BUCKET } from "./media-url";
import { prisma } from "./prisma";

/**
 * Neon Object Storage (S3-compatible). Credentials, endpoint and region come
 * from the AWS_* variables that `neon deploy` / `neon env pull` write, and are
 * branch-scoped. Neon requires path-style addressing.
 */
let client: S3Client | undefined;

export function getStorageClient(): S3Client {
  if (client) return client;
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const region = process.env.AWS_REGION;
  if (!endpoint || !region || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("Neon Object Storage env vars are missing (AWS_*). Run `neon deploy` or `neon env pull`.");
  }
  client = new S3Client({ endpoint, region, forcePathStyle: true });
  return client;
}

export const ALLOWED_MEDIA: Record<string, { type: MediaType; ext: string; maxBytes: number }> = {
  "image/jpeg": { type: "IMAGE", ext: "jpg", maxBytes: 8 * 1024 * 1024 },
  "image/png": { type: "IMAGE", ext: "png", maxBytes: 8 * 1024 * 1024 },
  "image/webp": { type: "IMAGE", ext: "webp", maxBytes: 8 * 1024 * 1024 },
  "image/avif": { type: "IMAGE", ext: "avif", maxBytes: 8 * 1024 * 1024 },
  "application/pdf": { type: "DOCUMENT", ext: "pdf", maxBytes: 15 * 1024 * 1024 },
};

export async function putObject(key: string, body: Uint8Array, contentType: string): Promise<void> {
  await getStorageClient().send(
    new PutObjectCommand({
      Bucket: MEDIA_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      // Keys are unique per upload (UUID), so objects never change and can be cached forever.
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

export async function deleteObject(key: string): Promise<void> {
  await getStorageClient().send(new DeleteObjectCommand({ Bucket: MEDIA_BUCKET, Key: key }));
}

export async function checkBucket(): Promise<void> {
  await getStorageClient().send(new HeadBucketCommand({ Bucket: MEDIA_BUCKET }));
}

export interface AttachMediaInput {
  listingId: string;
  body: Uint8Array;
  contentType: string;
  caption?: string | null;
  sortOrder?: number;
}

/**
 * Uploads a photo or notice PDF for a listing and records its key in Postgres.
 * If the database write fails, the uploaded object is removed so the bucket
 * doesn't accumulate orphans.
 */
export async function attachListingMedia(input: AttachMediaInput) {
  const spec = ALLOWED_MEDIA[input.contentType];
  if (!spec) {
    throw new Error(`Unsupported file type "${input.contentType}". Allowed: ${Object.keys(ALLOWED_MEDIA).join(", ")}`);
  }
  if (input.body.byteLength === 0) throw new Error("File is empty.");
  if (input.body.byteLength > spec.maxBytes) {
    throw new Error(`File is too large (${input.body.byteLength} bytes; max ${spec.maxBytes}).`);
  }

  const key = `listings/${input.listingId}/${randomUUID()}.${spec.ext}`;
  await putObject(key, input.body, input.contentType);

  try {
    return await prisma.listingMedia.create({
      data: {
        listingId: input.listingId,
        url: key,
        type: spec.type,
        caption: input.caption ?? null,
        sortOrder: input.sortOrder ?? 0,
      },
    });
  } catch (error) {
    await deleteObject(key).catch((cleanupError) =>
      console.error(`[storage] failed to remove orphaned object ${key}`, cleanupError),
    );
    throw error;
  }
}
