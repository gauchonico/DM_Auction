import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { SubmitButton } from "@/components/admin/buttons";
import { Card, Notice, PageHeader, RolePill, buttonSmall, td, th } from "@/components/admin/ui";
import { setStaffActive, setStaffRole } from "./actions";
import { CreateStaffForm, ResetPasswordForm } from "./StaffForms";

export const metadata = { title: "Staff" };

export default async function StaffPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const me = await requireAdmin();
  const params = await searchParams;
  const staff = await prisma.staffUser.findMany({
    orderBy: [{ active: "desc" }, { role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, active: true, lastLoginAt: true },
  });

  return (
    <>
      <PageHeader title="Staff" description="Who can sign in to the admin panel, and what they can do." />
      <Notice code={params.error ?? params.notice} />

      <div className="mb-6 overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-card">
        <table className="w-full min-w-[760px]">
          <thead className="border-b border-slate-100 bg-slate-50/70">
            <tr>
              <th className={th}>Person</th>
              <th className={th}>Role</th>
              <th className={th}>Last sign-in</th>
              <th className={th}>Status</th>
              <th className={`${th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staff.map((s) => {
              const self = s.id === me.id;
              return (
                <tr key={s.id} className={s.active ? "" : "bg-slate-50 text-slate-500"}>
                  <td className={td}>
                    <p className="font-semibold">{s.name}{self && <span className="ml-1 text-xs font-normal text-slate-500">(you)</span>}</p>
                    <p className="text-xs text-slate-500">{s.email}</p>
                  </td>
                  <td className={td}>
                    {self ? (
                      <RolePill role={s.role} />
                    ) : (
                      <form action={setStaffRole} className="flex items-center gap-1">
                        <input type="hidden" name="id" value={s.id} />
                        <label htmlFor={`role-${s.id}`} className="sr-only">Role for {s.name}</label>
                        <select id={`role-${s.id}`} name="role" defaultValue={s.role} className="min-h-9 rounded-md border border-slate-300 bg-white px-2 text-sm">
                          <option value="EDITOR">Editor</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <SubmitButton className={buttonSmall}>Save</SubmitButton>
                      </form>
                    )}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{s.lastLoginAt ? formatDateTime(s.lastLoginAt) : "Never"}</td>
                  <td className={td}>{s.active ? "Active" : "Deactivated"}</td>
                  <td className={`${td} text-right`}>
                    <div className="flex flex-wrap items-start justify-end gap-1">
                      <ResetPasswordForm userId={s.id} email={s.email} />
                      {!self && (
                        <form action={setStaffActive}>
                          <input type="hidden" name="id" value={s.id} />
                          <input type="hidden" name="active" value={s.active ? "false" : "true"} />
                          <SubmitButton className={`${buttonSmall} ${s.active ? "text-red-700" : ""}`}>
                            {s.active ? "Deactivate" : "Reactivate"}
                          </SubmitButton>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Card title="Add a staff member">
        <CreateStaffForm />
      </Card>
    </>
  );
}
