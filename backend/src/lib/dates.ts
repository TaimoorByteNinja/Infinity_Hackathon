/** Strict YYYY-MM-DD check that also rejects impossible dates like 2026-02-30. */
export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export const toDbDate = (value: string) => new Date(`${value}T00:00:00Z`);
export const fromDbDate = (d: Date) => d.toISOString().slice(0, 10);

/** Today's date in the company time zone (Asia/Karachi). */
export function todayInKarachi(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());
}
