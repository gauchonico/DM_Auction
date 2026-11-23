"use client";

import { useActionState, useEffect, useRef } from "react";
import { Upload } from "lucide-react";
import { IDLE } from "@/lib/admin/form";
import FormMessage from "@/components/admin/FormMessage";
import { SubmitButton } from "@/components/admin/buttons";
import { buttonPrimary, inputClass } from "@/components/admin/ui";
import { uploadMedia } from "./actions";

export default function UploadForm({ listingId }: { listingId: string }) {
  const [state, action] = useActionState(uploadMedia, IDLE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="listingId" value={listingId} />
      <FormMessage state={state} />
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label htmlFor="files" className="mb-1 block text-sm font-semibold text-slate-800">Photos or notice PDF</label>
          <input
            id="files"
            name="files"
            type="file"
            multiple
            required
            accept="image/jpeg,image/png,image/webp,image/avif,application/pdf"
            className="block w-full text-sm file:mr-3 file:min-h-11 file:rounded-md file:border-0 file:bg-slate-100 file:px-4 file:font-semibold file:text-slate-800 hover:file:bg-slate-200"
          />
          <p className="mt-1 text-xs text-slate-500">JPG, PNG, WebP or AVIF up to 8 MB; PDF up to 15 MB; max 10 files.</p>
        </div>
        <div>
          <label htmlFor="caption" className="mb-1 block text-sm font-semibold text-slate-800">Caption (optional)</label>
          <input id="caption" name="caption" maxLength={200} className={inputClass} placeholder="e.g. Front view" />
        </div>
        <SubmitButton className={buttonPrimary} pendingLabel="Uploading…">
          <Upload className="h-4 w-4" aria-hidden /> Upload
        </SubmitButton>
      </div>
    </form>
  );
}
