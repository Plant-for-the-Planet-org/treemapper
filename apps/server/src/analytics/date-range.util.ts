// src/analytics/date-range.util.ts
//
// Date range parsing shared by the Data Explorer and the export.
//
// The Data Explorer sends plain calendar dates (YYYY-MM-DD) because that is
// what the user picked in the date picker. `new Date('2026-08-24')` parses that
// as UTC midnight, which on a server west of UTC lands on the evening of the
// 23rd. Anything filtering on it then silently drops the last day of the range.
// These helpers read a date-only string as a local calendar date instead, so
// "24 August" means the whole of 24 August wherever the server runs.

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Local 00:00:00.000 on the given day. */
export function startOfDay(value: string | Date): Date {
  const match = typeof value === 'string' ? DATE_ONLY.exec(value) : null;
  if (match) {
    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
  }
  const parsed = new Date(value);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

/** Local 23:59:59.999 on the given day, so same-day records are included. */
export function endOfDay(value: string | Date): Date {
  const match = typeof value === 'string' ? DATE_ONLY.exec(value) : null;
  if (match) {
    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999);
  }
  const parsed = new Date(value);
  parsed.setHours(23, 59, 59, 999);
  return parsed;
}
