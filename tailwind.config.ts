import type { Config } from "tailwindcss";

const systemSans = ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"];

const config: Config = {
  // lib/ holds class names too (e.g. SELLER_BADGE colours in lib/constants.ts).
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Company colour #023E8A and its scale.
        brand: {
          DEFAULT: "#023E8A",
          light: "#0353A4", // hover on solid brand
          dark: "#012A5E",
          tint: "#5B8BCB", // secondary chart bars (≥3:1 on white, validated)
          50: "#EEF4FB",
          100: "#DCE8F6",
          200: "#B7CFEC",
        },
        accent: {
          DEFAULT: "#C8102E",
          dark: "#A00D25",
        },
        whatsapp: {
          DEFAULT: "#25D366",
          dark: "#0B7A5C",
          darker: "#08654B",
        },
        canvas: "#F4F6FA", // admin page background
      },
      fontFamily: {
        // Public site: system fonts (no download on low-data connections).
        sans: systemSans,
        // Admin panel (self-hosted via @fontsource, loaded only under /admin):
        ui: ["Inter Variable", "Inter", ...systemSans], // best overall
        data: ["IBM Plex Sans", ...systemSans], // dense enterprise tables
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "Consolas", "monospace"], // codes, refs, IPs
        report: ["Source Sans 3 Variable", "Source Sans 3", ...systemSans], // charts & summaries
        compact: ["Barlow", ...systemSans], // tight stat cards & chips
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
