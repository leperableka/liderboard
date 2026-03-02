/**
 * Converts a Moscow-date string "YYYY-MM-DD" into a JS Date representing
 * midnight Moscow time (UTC+3).  Example: "2026-03-06" → 2026-03-05T21:00:00Z.
 *
 * All date env vars (CONTEST_START, CONTEST_END, REGISTRATION_DEADLINE) are
 * stored in YYYY-MM-DD Moscow format so backend and frontend share the same
 * values without format conversion.
 */
export function moscowDateToUtc(mskDate: string): Date {
  return new Date(`${mskDate}T00:00:00+03:00`);
}
