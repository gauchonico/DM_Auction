"use client";

import { useActionState, useEffect, useRef } from "react";
import { KeyRound } from "lucide-react";
import { IDLE } from "@/lib/admin/form";
import FormMessage from "@/components/admin/FormMessage";
import { SubmitButton } from "@/components/admin/buttons";
import { Field, buttonPrimary, inputClass } from "@/components/admin/ui";
import { changePassword } from "./actions";

export default function PasswordForm({ minLength }: { minLength: number }) {
  const [state, action] = useActionState(changePassword, IDLE);
  const errors = state.fieldErrors ?? {};
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <FormMessage state={state} />
      <Field id="current" label="Current password" error={errors.current}>
        <input id="current" name="current" type="password" required autoComplete="current-password" className={inputClass} aria-invalid={Boolean(errors.current)} />
      </Field>
      <Field id="next" label="New password" error={errors.next} hint={`At least ${minLength} characters.`}>
        <input id="next" name="next" type="password" required minLength={minLength} autoComplete="new-password" className={inputClass} aria-invalid={Boolean(errors.next)} />
      </Field>
      <Field id="confirm" label="Confirm new password" error={errors.confirm}>
        <input id="confirm" name="confirm" type="password" required autoComplete="new-password" className={inputClass} aria-invalid={Boolean(errors.confirm)} />
      </Field>
      <SubmitButton className={buttonPrimary} pendingLabel="Saving…">
        <KeyRound className="h-4 w-4" aria-hidden /> Change password
      </SubmitButton>
    </form>
  );
}
