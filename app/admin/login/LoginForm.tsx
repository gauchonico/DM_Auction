"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { login } from "../auth-actions";
import { IDLE } from "@/lib/admin/form";
import FormMessage from "@/components/admin/FormMessage";
import { SubmitButton } from "@/components/admin/buttons";
import { buttonPrimary, inputClass } from "@/components/admin/ui";

export default function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(login, IDLE);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-semibold text-slate-800">Email</label>
        <input id="email" name="email" type="email" required autoComplete="username" autoFocus className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-semibold text-slate-800">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className={inputClass} />
      </div>
      <SubmitButton className={`${buttonPrimary} w-full`} pendingLabel="Signing in…">
        <LogIn className="h-4 w-4" aria-hidden /> Sign in
      </SubmitButton>
    </form>
  );
}
