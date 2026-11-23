import type { Prisma } from "@prisma/client";

const DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const kampala = new Intl.DateTimeFormat("en-UG", {
  timeZone: "Africa/Kampala",
  dateStyle: "medium",
  timeStyle: "short",
});

function show(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" && DATE_RE.test(value)) return kampala.format(new Date(value));
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function isDiff(v: unknown): v is { from: unknown; to: unknown } {
  return typeof v === "object" && v !== null && "from" in v && "to" in v;
}

/** Renders an audit entry's `changes` JSON: a before → after table for diffs, key/value otherwise. */
export default function AuditChanges({ changes }: { changes: Prisma.JsonValue | null }) {
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) return null;
  const entries = Object.entries(changes);
  if (entries.length === 0) return null;

  return (
    <table className="mt-2 w-full text-xs">
      <tbody className="divide-y divide-slate-100">
        {entries.map(([field, value]) => (
          <tr key={field} className="align-top">
            <th scope="row" className="w-32 py-1 pr-2 text-left font-semibold text-slate-600">{field}</th>
            {isDiff(value) ? (
              <td className="py-1">
                <span className="whitespace-pre-wrap break-words rounded bg-red-50 px-1 text-red-900 line-through decoration-red-300">{show(value.from)}</span>
                <span className="mx-1 text-slate-400" aria-label="changed to">→</span>
                <span className="whitespace-pre-wrap break-words rounded bg-emerald-50 px-1 text-emerald-900">{show(value.to)}</span>
              </td>
            ) : (
              <td className="whitespace-pre-wrap break-words py-1 text-slate-800">{show(value)}</td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
