import { requireStaff, MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { Card, PageHeader, RolePill } from "@/components/admin/ui";
import PasswordForm from "./PasswordForm";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const me = await requireStaff();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="My account" />
      <Card>
        <dl className="grid gap-2 text-sm sm:grid-cols-[8rem_1fr]">
          <dt className="font-semibold text-slate-600">Name</dt><dd>{me.name}</dd>
          <dt className="font-semibold text-slate-600">Email</dt><dd>{me.email}</dd>
          <dt className="font-semibold text-slate-600">Role</dt><dd><RolePill role={me.role} /></dd>
        </dl>
      </Card>
      <Card title="Change password">
        <PasswordForm minLength={MIN_PASSWORD_LENGTH} />
      </Card>
    </div>
  );
}
