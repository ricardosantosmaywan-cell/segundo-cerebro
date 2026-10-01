import type { DateOnly } from "@/lib/data/types";

/** Local calendar date as "YYYY-MM-DD" (not UTC, so late evenings don't jump a day). */
export function toDateOnly(d: Date): DateOnly {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function today(): DateOnly {
  return toDateOnly(new Date());
}

function parse(date: DateOnly): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: DateOnly, days: number): DateOnly {
  const d = parse(date);
  d.setDate(d.getDate() + days);
  return toDateOnly(d);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function diffDays(from: DateOnly, to: DateOnly): number {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / 86_400_000);
}

// Fixed list: Intl output for pt-PT short dates varies between browsers ("11/10" vs "11 out").
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "11 out" */
export function formatShort(date: DateOnly): string {
  const d = parse(date);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "hoje", "amanhã", "ontem", "em 3 dias", "há 2 dias" or a short date. */
export function relativeDay(date: DateOnly, ref: DateOnly = today()): string {
  const n = diffDays(ref, date);
  if (n === 0) return "hoje";
  if (n === 1) return "amanhã";
  if (n === -1) return "ontem";
  if (n > 1 && n <= 7) return `em ${n} dias`;
  if (n < -1 && n >= -7) return `há ${-n} dias`;
  return formatShort(date);
}
