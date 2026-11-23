/**
 * Turns a stored ListingMedia.url value into a browser URL.
 *
 * New media is stored as an object *key* in the Neon Object Storage bucket
 * (e.g. "listings/<id>/<uuid>.jpg"), not a full URL. The storage endpoint is
 * branch-scoped, so resolving at render time keeps the same rows working on
 * production and on preview branches. Absolute http(s) URLs are passed through
 * for legacy or externally hosted media.
 *
 * Kept free of the AWS SDK so it can be imported anywhere cheaply.
 */
export const MEDIA_BUCKET = process.env.MEDIA_BUCKET ?? "assets";

export function storageEndpoint(): string | null {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  return endpoint ? endpoint.replace(/\/$/, "") : null;
}

export function publicObjectUrl(key: string): string {
  const endpoint = storageEndpoint();
  if (!endpoint) throw new Error("AWS_ENDPOINT_URL_S3 is not set — run `neon env pull` or `neon deploy`.");
  const path = key.split("/").map(encodeURIComponent).join("/");
  return `${endpoint}/${MEDIA_BUCKET}/${path}`;
}

export function resolveMediaUrl(stored: string): string {
  return /^https?:\/\//i.test(stored) ? stored : publicObjectUrl(stored.replace(/^\/+/, ""));
}
