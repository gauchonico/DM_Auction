/**
 * Small, dependency-free helpers for reading and validating admin FormData.
 */

export interface FormState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  /** One-time secret to show the admin (e.g. a temporary password). */
  secret?: string;
}

export const IDLE: FormState = { status: "idle" };

export class FieldErrors {
  readonly errors: Record<string, string> = {};
  add(field: string, message: string) {
    if (!this.errors[field]) this.errors[field] = message;
  }
  get any() {
    return Object.keys(this.errors).length > 0;
  }
  toState(message = "Please correct the highlighted fields."): FormState {
    return { status: "error", message, fieldErrors: this.errors };
  }
}

export function str(form: FormData, key: string, max = 500): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export function optStr(form: FormData, key: string, max = 500): string | null {
  const v = str(form, key, max);
  return v.length > 0 ? v : null;
}

export function bool(form: FormData, key: string): boolean {
  const v = form.get(key);
  return v === "on" || v === "true" || v === "1";
}

export function strList(form: FormData, key: string): string[] {
  return form
    .getAll(key)
    .filter((v): v is string => typeof v === "string" && v.length > 0 && v.length <= 64);
}

export function oneOf<T extends string>(value: string, allowed: readonly T[]): T | null {
  return (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

/** Parses "450,000,000" / "450000000" into a non-negative whole number, or null when blank. */
export function money(form: FormData, key: string, errors: FieldErrors): number | null {
  const raw = str(form, key, 30).replace(/[,\s]/g, "");
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
    errors.add(key, "Enter a whole amount in UGX, e.g. 450000000.");
    return null;
  }
  if (n > 1e14) {
    errors.add(key, "Amount is too large.");
    return null;
  }
  return n;
}

/* ------------------------------------------------------------------ */
/* Kampala (UTC+3, no DST) <-> <input type="datetime-local">           */
/* ------------------------------------------------------------------ */

const KAMPALA_OFFSET = "+03:00";

/** "2026-11-27T10:00" entered by staff (Kampala time) -> Date, or null if blank/invalid. */
export function kampalaDateTime(form: FormData, key: string, errors: FieldErrors, required: boolean): Date | null {
  const raw = str(form, key, 20);
  if (!raw) {
    if (required) errors.add(key, "Required.");
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) {
    errors.add(key, "Enter a valid date and time.");
    return null;
  }
  const d = new Date(`${raw}:00${KAMPALA_OFFSET}`);
  if (Number.isNaN(d.getTime())) {
    errors.add(key, "Enter a valid date and time.");
    return null;
  }
  return d;
}

/** Date -> "YYYY-MM-DDTHH:mm" in Kampala time, for datetime-local default values. */
export function toKampalaInput(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

/** True for Prisma unique-constraint violations. */
export function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === "P2002";
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
