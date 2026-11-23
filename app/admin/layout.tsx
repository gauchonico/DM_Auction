// Admin-only web fonts, self-hosted (no third-party requests) and loaded only on /admin routes,
// so the public site keeps its zero-download system font stack.
import "@fontsource-variable/inter/wght.css"; // Inter — overall UI
import "@fontsource/ibm-plex-sans/400.css"; // IBM Plex Sans — dense data tables
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css"; // IBM Plex Mono — references, action codes, IPs
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource-variable/source-sans-3/wght.css"; // Source Sans 3 — charts & report summaries
import "@fontsource/barlow/500.css"; // Barlow — compact stat cards & chips
import "@fontsource/barlow/600.css";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="font-ui text-slate-900 antialiased">{children}</div>;
}
