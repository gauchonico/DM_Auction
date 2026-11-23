import type { Metadata, Viewport } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Verified Bank, Bailiff & Receiver Auctions`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Find verified property, vehicle and machinery auctions in Uganda from banks, court bailiffs and receivers — the digital home of Daily Monitor auction notices.",
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "en_UG",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B2545",
};

/** Root shell only. The public site and the admin panel each supply their own chrome. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-UG">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
