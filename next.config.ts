import type { NextConfig } from "next";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

/**
 * Only optimise images served from this branch's Neon Object Storage bucket.
 * The endpoint comes from AWS_ENDPOINT_URL_S3 (written by `neon deploy`).
 */
function storageImagePattern(): RemotePattern[] {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  if (!endpoint) {
    console.warn("[next.config] AWS_ENDPOINT_URL_S3 is not set; listing images from storage will not load.");
    return [];
  }
  const url = new URL(endpoint);
  const bucket = process.env.MEDIA_BUCKET ?? "assets";
  return [
    {
      protocol: url.protocol.replace(":", "") as "https" | "http",
      hostname: url.hostname,
      port: url.port,
      pathname: `/${bucket}/**`,
    },
  ];
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Serve small modern formats to keep mobile data usage low.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 768, 1024, 1280],
    imageSizes: [64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: storageImagePattern(),
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    // Admin media uploads go through Server Actions (default limit is 1 MB).
    serverActions: { bodySizeLimit: "40mb" },
  },
};

export default nextConfig;
