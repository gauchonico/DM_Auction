import { resolveMediaUrl } from "./media-url";

/**
 * Marketing images stored in the Neon Object Storage bucket under stable,
 * versioned keys (upload a new "-v2" key to change one, so caches never serve stale art).
 * Photos: Unsplash contributors, used under the Unsplash License.
 */
export const SITE_IMAGES = {
  hero: "site/hero-v1.jpg",
  house: "site/house-v1.jpg",
  apartment: "site/apartment-v1.jpg",
  commercial: "site/commercial-v1.jpg",
  land: "site/land-v1.jpg",
  suv: "site/suv-v1.jpg",
  sedan: "site/sedan-v1.jpg",
  truck: "site/truck-v1.jpg",
  excavator: "site/excavator-v1.jpg",
  tractor: "site/tractor-v1.jpg",
  office: "site/office-v1.jpg",
  gavel: "site/gavel-v1.jpg",
  city: "site/city-v1.jpg",
} as const;

export type SiteImage = keyof typeof SITE_IMAGES;

export function siteImage(slot: SiteImage): string {
  return resolveMediaUrl(SITE_IMAGES[slot]);
}

/** Banner image per category slug (falls back to the gavel). */
export function categoryImage(slug: string): string {
  const map: Record<string, SiteImage> = {
    "real-estate": "house",
    vehicles: "suv",
    machinery: "excavator",
    "general-assets": "office",
  };
  return siteImage(map[slug] ?? "gavel");
}
