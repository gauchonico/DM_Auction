const TIME_ZONE = "Africa/Kampala";
const LOCALE = "en-UG";

const numberFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const longDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** Anything Prisma's Decimal, a number, or a numeric string can be coerced from. */
export type NumericLike = number | string | { toString(): string };

export function toNumber(value: NumericLike | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value.toString());
  return Number.isFinite(n) ? n : null;
}

/** "UGX 450,000,000" or "Refer to Notice" when no reserve price is published. */
export function formatUGX(value: NumericLike | null | undefined, fallback = "Refer to Notice"): string {
  const n = toNumber(value);
  if (n === null || n <= 0) return fallback;
  return `UGX ${numberFormatter.format(n)}`;
}

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

export function formatLongDate(date: Date): string {
  return longDateFormatter.format(date);
}

export function formatTime(date: Date): string {
  return timeFormatter.format(date).toUpperCase();
}

export function formatDateTime(date: Date): string {
  return `${formatDate(date)} · ${formatTime(date)}`;
}

/** Midnight today in Kampala (UTC+3, no DST), expressed as a UTC Date. */
export function kampalaStartOfToday(now: Date = new Date()): Date {
  const offsetMs = 3 * 60 * 60 * 1000;
  const local = new Date(now.getTime() + offsetMs);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - offsetMs);
}

/** Whole days from now until the given date (negative if in the past). */
export function daysUntil(date: Date, now: Date = new Date()): number {
  return Math.ceil((date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}
