import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { FormState } from "@/lib/admin/form";

export default function FormMessage({ state }: { state: FormState }) {
  if (state.status === "idle" || !state.message) return null;
  const ok = state.status === "success";
  const Icon = ok ? CheckCircle2 : AlertTriangle;
  return (
    <p
      role={ok ? "status" : "alert"}
      className={`flex items-start gap-2 rounded-md p-3 text-sm font-semibold ${
        ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-800"
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      {state.message}
    </p>
  );
}
