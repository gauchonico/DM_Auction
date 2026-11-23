"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Read-only text with a copy button. Without JavaScript the text is still selectable. */
export default function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-stretch gap-2">
      <input
        readOnly
        value={value}
        aria-label={label}
        onFocus={(e) => e.currentTarget.select()}
        className="min-h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 font-mono text-sm text-slate-800"
      />
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {
            /* clipboard blocked: the field is still selectable */
          }
        }}
        className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:border-brand/30 hover:text-brand"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
