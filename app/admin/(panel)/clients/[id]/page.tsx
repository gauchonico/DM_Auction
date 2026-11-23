import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ConfirmButton } from "@/components/admin/buttons";
import { Card, Notice, PageHeader, buttonDanger, buttonSecondary } from "@/components/admin/ui";
import AuditHistory from "@/components/admin/AuditHistory";
import ClientForm from "../ClientForm";
import { deleteClient } from "../actions";

export const metadata = { title: "Edit client" };

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EditClientPage({ params, searchParams }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const query = await searchParams;
  const client = await prisma.client.findUnique({
    where: { id },
    include: { _count: { select: { listings: true } } },
  });
  if (!client) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/clients" className="mb-2 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-brand hover:underline">
          <ChevronLeft className="h-4 w-4" aria-hidden /> Clients
        </Link>
        <PageHeader
          title={client.name}
          description={`${client._count.listings} listing${client._count.listings === 1 ? "" : "s"}`}
          actions={
            client.verified && (
              <Link href={`/clients/${client.id}`} target="_blank" className={buttonSecondary}>
                <ExternalLink className="h-4 w-4" aria-hidden /> Public portfolio
              </Link>
            )
          }
        />
        <Notice code={query.error ?? query.notice} />
      </div>

      <ClientForm
        clientId={client.id}
        values={{
          name: client.name,
          type: client.type,
          verified: client.verified,
          phone: client.phone ?? "",
          whatsapp: client.whatsapp ?? "",
          email: client.email ?? "",
        }}
      />

      <AuditHistory entityType="CLIENT" entityId={client.id} showFullLogLink />

      <Card title="Delete client">
        {client._count.listings > 0 ? (
          <p className="text-sm text-slate-600">
            This client has {client._count.listings} listing{client._count.listings === 1 ? "" : "s"} and can&apos;t be deleted.
            To stop showing them as trusted, untick <strong>Verified advertiser</strong> instead.
          </p>
        ) : (
          <form action={deleteClient} className="flex flex-wrap items-center justify-between gap-3">
            <input type="hidden" name="id" value={client.id} />
            <p className="text-sm text-slate-600">Permanently remove this client.</p>
            <ConfirmButton className={buttonDanger} message={`Delete ${client.name}? This cannot be undone.`}>
              <Trash2 className="h-4 w-4" aria-hidden /> Delete client
            </ConfirmButton>
          </form>
        )}
      </Card>
    </div>
  );
}
