import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import ClientForm from "../ClientForm";

export const metadata = { title: "New client" };

export default async function NewClientPage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/clients" className="mb-2 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-brand hover:underline">
        <ChevronLeft className="h-4 w-4" aria-hidden /> Clients
      </Link>
      <PageHeader title="New client" />
      <ClientForm clientId={null} values={{ name: "", type: "", verified: false, phone: "", whatsapp: "", email: "" }} />
    </div>
  );
}
