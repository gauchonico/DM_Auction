"use client";

import { useActionState, useState } from "react";
import { Save } from "lucide-react";
import type { ListingStatus } from "@prisma/client";
import { IDLE } from "@/lib/admin/form";
import FormMessage from "@/components/admin/FormMessage";
import { SubmitButton } from "@/components/admin/buttons";
import { Card, Field, buttonPrimary, inputClass } from "@/components/admin/ui";
import { saveListing } from "./actions";

export interface ListingFormValues {
  referenceId: string;
  title: string;
  description: string;
  categoryId: string;
  subTypeId: string;
  clientId: string;
  district: string;
  locationDetail: string;
  reservePrice: string;
  saleDate: string; // datetime-local, Kampala time
  deadlineDate: string;
  inspectionNotes: string;
  status: ListingStatus;
  isFeatured: boolean;
  tagIds: string[];
}

export interface ListingFormOptions {
  categories: { id: string; name: string; subTypes: { id: string; name: string }[] }[];
  clients: { id: string; name: string; verified: boolean }[];
  tags: { id: string; name: string }[];
  districts: string[];
}

interface Props {
  listingId: string | null;
  values: ListingFormValues;
  options: ListingFormOptions;
  isAdmin: boolean;
}

export default function ListingForm({ listingId, values, options, isAdmin }: Props) {
  const [state, action] = useActionState(saveListing, IDLE);
  const [categoryId, setCategoryId] = useState(values.categoryId);
  const errors = state.fieldErrors ?? {};
  const err = (key: string) => ({ "aria-invalid": Boolean(errors[key]), "aria-describedby": errors[key] ? `${key}-error` : undefined });
  const subTypes = options.categories.find((c) => c.id === categoryId)?.subTypes ?? [];

  return (
    <form action={action} className="space-y-6">
      {listingId && <input type="hidden" name="listingId" value={listingId} />}
      <FormMessage state={state} />

      {!isAdmin && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Saving sends this listing for review. {values.status === "PUBLISHED" && "It will be hidden from the public site until an admin publishes it again."}
        </p>
      )}

      <Card title="Notice details">
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="referenceId" label="Notice reference" error={errors.referenceId} hint="As printed in the Daily Monitor, e.g. DM-2026-0142">
            <input id="referenceId" name="referenceId" required maxLength={40} defaultValue={values.referenceId} className={`${inputClass} uppercase`} {...err("referenceId")} />
          </Field>
          <Field id="clientId" label="Advertiser (client)" error={errors.clientId}>
            <select id="clientId" name="clientId" required defaultValue={values.clientId} className={inputClass} {...err("clientId")}>
              <option value="" disabled>Select…</option>
              {options.clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.verified ? "" : " (unverified)"}</option>
              ))}
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field id="title" label="Title" error={errors.title}>
              <input id="title" name="title" required maxLength={200} defaultValue={values.title} className={inputClass} {...err("title")} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field id="description" label="Property particulars" error={errors.description} hint="Separate paragraphs with a blank line.">
              <textarea id="description" name="description" required rows={6} maxLength={10000} defaultValue={values.description} className={`${inputClass} py-2`} {...err("description")} />
            </Field>
          </div>
        </div>
      </Card>

      <Card title="Classification & location">
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="categoryId" label="Category" error={errors.categoryId}>
            <select
              id="categoryId"
              name="categoryId"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputClass}
              {...err("categoryId")}
            >
              <option value="" disabled>Select…</option>
              {options.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field id="subTypeId" label="Sub-type (optional)" error={errors.subTypeId}>
            <select
              key={categoryId /* reset when the category changes */}
              id="subTypeId"
              name="subTypeId"
              defaultValue={subTypes.some((s) => s.id === values.subTypeId) ? values.subTypeId : ""}
              className={inputClass}
              {...err("subTypeId")}
            >
              <option value="">None</option>
              {subTypes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field id="district" label="District" error={errors.district}>
            <input id="district" name="district" required list="district-options" maxLength={60} defaultValue={values.district} className={inputClass} {...err("district")} />
            <datalist id="district-options">
              {options.districts.map((d) => <option key={d} value={d} />)}
            </datalist>
          </Field>
          <Field id="locationDetail" label="Location detail (optional)" error={errors.locationDetail} hint="e.g. Ntinda, Kigoowa or Plot 12 Jinja Road">
            <input id="locationDetail" name="locationDetail" maxLength={200} defaultValue={values.locationDetail} className={inputClass} />
          </Field>
          {options.tags.length > 0 && (
            <fieldset className="md:col-span-2">
              <legend className="mb-2 text-sm font-semibold text-slate-800">Tags</legend>
              <div className="flex flex-wrap gap-2">
                {options.tags.map((t) => (
                  <label key={t.id} className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border border-slate-300 px-3 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-50">
                    <input type="checkbox" name="tagIds" value={t.id} defaultChecked={values.tagIds.includes(t.id)} className="h-4 w-4 accent-brand" />
                    {t.name}
                  </label>
                ))}
              </div>
              {errors.tagIds && <p className="mt-1 text-sm text-red-700">{errors.tagIds}</p>}
            </fieldset>
          )}
        </div>
      </Card>

      <Card title="Sale terms">
        <div className="grid gap-4 md:grid-cols-3">
          <Field id="saleDate" label="Auction date & time (Kampala)" error={errors.saleDate}>
            <input id="saleDate" name="saleDate" type="datetime-local" required defaultValue={values.saleDate} className={inputClass} {...err("saleDate")} />
          </Field>
          <Field id="deadlineDate" label="Bid / registration deadline" error={errors.deadlineDate} hint="Optional">
            <input id="deadlineDate" name="deadlineDate" type="datetime-local" defaultValue={values.deadlineDate} className={inputClass} {...err("deadlineDate")} />
          </Field>
          <Field id="reservePrice" label="Reserve price (UGX)" error={errors.reservePrice} hint="Leave blank to show “Refer to Notice”">
            <input id="reservePrice" name="reservePrice" inputMode="numeric" maxLength={20} defaultValue={values.reservePrice} placeholder="e.g. 450000000" className={inputClass} {...err("reservePrice")} />
          </Field>
          <div className="md:col-span-3">
            <Field id="inspectionNotes" label="Inspection instructions (optional)" error={errors.inspectionNotes}>
              <textarea id="inspectionNotes" name="inspectionNotes" rows={3} maxLength={4000} defaultValue={values.inspectionNotes} className={`${inputClass} py-2`} />
            </Field>
          </div>
        </div>
      </Card>

      {isAdmin && (
        <Card title="Publishing">
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="status" label="Status">
              <select id="status" name="status" defaultValue={values.status} className={inputClass}>
                <option value="PENDING">Pending — not visible</option>
                <option value="PUBLISHED">Published — live on the site</option>
                <option value="EXPIRED">Expired — kept for reference</option>
              </select>
            </Field>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 self-end text-sm font-semibold text-slate-800">
              <input type="checkbox" name="isFeatured" defaultChecked={values.isFeatured} className="h-5 w-5 accent-brand" />
              Featured (shown first on the home page)
            </label>
          </div>
        </Card>
      )}

      <div className="flex justify-end">
        <SubmitButton className={buttonPrimary} pendingLabel="Saving…">
          <Save className="h-4 w-4" aria-hidden />
          {isAdmin ? "Save listing" : "Save & submit for review"}
        </SubmitButton>
      </div>
    </form>
  );
}
