"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import type { ClientType } from "@prisma/client";
import { IDLE } from "@/lib/admin/form";
import FormMessage from "@/components/admin/FormMessage";
import { SubmitButton } from "@/components/admin/buttons";
import { Card, Field, buttonPrimary, inputClass } from "@/components/admin/ui";
import { saveClient } from "./actions";

export interface ClientFormValues {
  name: string;
  type: ClientType | "";
  verified: boolean;
  phone: string;
  whatsapp: string;
  email: string;
}

const TYPE_LABELS: Record<ClientType, string> = {
  BANK: "Bank / financial institution",
  BAILIFF: "Court bailiff / auctioneer",
  RECEIVER: "Receiver / liquidator",
  PRIVATE: "Private seller",
};

export default function ClientForm({ clientId, values }: { clientId: string | null; values: ClientFormValues }) {
  const [state, action] = useActionState(saveClient, IDLE);
  const errors = state.fieldErrors ?? {};
  const err = (key: string) => ({ "aria-invalid": Boolean(errors[key]), "aria-describedby": errors[key] ? `${key}-error` : undefined });

  return (
    <form action={action} className="space-y-4">
      {clientId && <input type="hidden" name="clientId" value={clientId} />}
      <FormMessage state={state} />
      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="name" label="Organisation name" error={errors.name}>
            <input id="name" name="name" required maxLength={160} defaultValue={values.name} className={inputClass} {...err("name")} />
          </Field>
          <Field id="type" label="Client type" error={errors.type}>
            <select id="type" name="type" required defaultValue={values.type} className={inputClass} {...err("type")}>
              <option value="" disabled>Select…</option>
              {(Object.keys(TYPE_LABELS) as ClientType[]).map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </Field>
          <Field id="phone" label="Phone (optional)" error={errors.phone} hint="Shown as a Call button on listings">
            <input id="phone" name="phone" type="tel" maxLength={30} defaultValue={values.phone} className={inputClass} {...err("phone")} />
          </Field>
          <Field id="whatsapp" label="WhatsApp number (optional)" error={errors.whatsapp} hint="Used for the WhatsApp Enquiry button">
            <input id="whatsapp" name="whatsapp" type="tel" maxLength={30} defaultValue={values.whatsapp} className={inputClass} {...err("whatsapp")} />
          </Field>
          <Field id="email" label="Email (optional)" error={errors.email}>
            <input id="email" name="email" type="email" maxLength={160} defaultValue={values.email} className={inputClass} {...err("email")} />
          </Field>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 self-end text-sm font-semibold text-slate-800">
            <input type="checkbox" name="verified" defaultChecked={values.verified} className="h-5 w-5 accent-brand" />
            Verified advertiser (shows the verified badge and portfolio page)
          </label>
        </div>
      </Card>
      <div className="flex justify-end">
        <SubmitButton className={buttonPrimary} pendingLabel="Saving…">
          <Save className="h-4 w-4" aria-hidden /> Save client
        </SubmitButton>
      </div>
    </form>
  );
}
