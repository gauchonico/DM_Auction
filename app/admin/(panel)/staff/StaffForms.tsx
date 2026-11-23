"use client";

import { useActionState } from "react";
import { KeyRound, UserPlus } from "lucide-react";
import { IDLE, type FormState } from "@/lib/admin/form";
import FormMessage from "@/components/admin/FormMessage";
import { SubmitButton } from "@/components/admin/buttons";
import { Field, buttonPrimary, buttonSmall, inputClass } from "@/components/admin/ui";
import { createStaff, resetStaffPassword } from "./actions";

function Secret({ state }: { state: FormState }) {
  if (!state.secret) return null;
  return (
    <p className="mt-2 rounded-md bg-slate-900 px-3 py-2 font-mono text-sm tracking-wide text-white">
      <span className="select-all">{state.secret}</span>
    </p>
  );
}

export function CreateStaffForm() {
  const [state, action] = useActionState(createStaff, IDLE);
  const errors = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4">
      <div>
        <FormMessage state={state} />
        <Secret state={state} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field id="staff-name" label="Full name" error={errors.name}>
          <input id="staff-name" name="name" required maxLength={120} className={inputClass} aria-invalid={Boolean(errors.name)} />
        </Field>
        <Field id="staff-email" label="Work email" error={errors.email}>
          <input id="staff-email" name="email" type="email" required maxLength={160} className={inputClass} aria-invalid={Boolean(errors.email)} />
        </Field>
        <Field id="staff-role" label="Role" error={errors.role}>
          <select id="staff-role" name="role" defaultValue="EDITOR" className={inputClass}>
            <option value="EDITOR">Editor — creates listings for review</option>
            <option value="ADMIN">Admin — full access</option>
          </select>
        </Field>
      </div>
      <SubmitButton className={buttonPrimary} pendingLabel="Creating…">
        <UserPlus className="h-4 w-4" aria-hidden /> Create account
      </SubmitButton>
    </form>
  );
}

export function ResetPasswordForm({ userId, email }: { userId: string; email: string }) {
  const [state, action] = useActionState(resetStaffPassword, IDLE);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`Reset the password for ${email}? They will be signed out everywhere.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <SubmitButton className={buttonSmall}>
        <KeyRound className="h-3.5 w-3.5" aria-hidden /> Reset password
      </SubmitButton>
      {state.status !== "idle" && (
        <div className="mt-2 max-w-xs text-left text-xs">
          <span className={state.status === "error" ? "text-red-700" : "text-slate-700"}>{state.message}</span>
          <Secret state={state} />
        </div>
      )}
    </form>
  );
}
