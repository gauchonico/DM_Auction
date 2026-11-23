"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { submitAdvertiserEnquiry, type EnquiryState } from "@/app/(site)/advertisers/actions";

const initialState: EnquiryState = { status: "idle" };

const inputClass =
  "block min-h-12 w-full rounded-xl border bg-white px-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/30 sm:text-sm";

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-slate-800">{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}

export default function AdvertiserEnquiryForm() {
  const [state, formAction, pending] = useActionState(submitAdvertiserEnquiry, initialState);
  const errors = state.fieldErrors ?? {};
  const border = (key: keyof typeof errors) => (errors[key] ? "border-red-500" : "border-slate-300");
  const describedBy = (key: keyof typeof errors, id: string) => (errors[key] ? `${id}-error` : undefined);

  if (state.status === "success") {
    return (
      <div role="status" className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" aria-hidden />
        <p className="text-emerald-900">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.status === "error" && state.message && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{state.message}</p>
      )}

      {/* Honeypot field for basic bot protection */}
      <div className="hidden" aria-hidden>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="organisation" label="Organisation" error={errors.organisation}>
          <input id="organisation" name="organisation" required maxLength={160} autoComplete="organization"
            aria-invalid={Boolean(errors.organisation)} aria-describedby={describedBy("organisation", "organisation")}
            className={`${inputClass} ${border("organisation")}`} />
        </Field>
        <Field id="clientType" label="Organisation type" error={errors.clientType}>
          <select id="clientType" name="clientType" required defaultValue=""
            aria-invalid={Boolean(errors.clientType)} aria-describedby={describedBy("clientType", "clientType")}
            className={`${inputClass} ${border("clientType")}`}>
            <option value="" disabled>Select…</option>
            <option value="BANK">Bank / Financial institution</option>
            <option value="BAILIFF">Court bailiff / Auctioneer</option>
            <option value="RECEIVER">Receiver / Liquidator</option>
            <option value="PRIVATE">Private seller</option>
          </select>
        </Field>
        <Field id="contactName" label="Contact person" error={errors.contactName}>
          <input id="contactName" name="contactName" required maxLength={120} autoComplete="name"
            aria-invalid={Boolean(errors.contactName)} aria-describedby={describedBy("contactName", "contactName")}
            className={`${inputClass} ${border("contactName")}`} />
        </Field>
        <Field id="phone" label="Phone / WhatsApp" error={errors.phone}>
          <input id="phone" name="phone" type="tel" required maxLength={30} autoComplete="tel" inputMode="tel"
            aria-invalid={Boolean(errors.phone)} aria-describedby={describedBy("phone", "phone")}
            className={`${inputClass} ${border("phone")}`} />
        </Field>
      </div>

      <Field id="email" label="Email (optional)" error={errors.email}>
        <input id="email" name="email" type="email" maxLength={160} autoComplete="email"
          aria-invalid={Boolean(errors.email)} aria-describedby={describedBy("email", "email")}
          className={`${inputClass} ${border("email")}`} />
      </Field>

      <Field id="message" label="What would you like to advertise?" error={errors.message}>
        <textarea id="message" name="message" required rows={4} maxLength={2000}
          aria-invalid={Boolean(errors.message)} aria-describedby={describedBy("message", "message")}
          className={`${inputClass} ${border("message")} py-2`} />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 font-semibold text-white hover:bg-brand-light disabled:opacity-60 sm:w-auto"
      >
        {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Send className="h-5 w-5" aria-hidden />}
        {pending ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}
