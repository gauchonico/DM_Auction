import "@fontsource-variable/inter/wght.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NotFoundContent from "@/components/NotFoundContent";

// Global 404 for unmatched URLs; sits outside the (site) layout, so it adds the public chrome itself.
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-ui text-slate-600 antialiased">
      <Navbar />
      <main id="main" className="flex-1">
        <NotFoundContent />
      </main>
      <Footer />
    </div>
  );
}
