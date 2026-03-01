/**
 * Tournament configuration — all dates are in Moscow timezone (UTC+3).
 * Override via environment variables to avoid touching source code
 * when dates change for future tournaments.
 */
export const CONTEST_START_MOSCOW: string =
  process.env['CONTEST_START'] ?? '2026-03-06';

export const CONTEST_END_MOSCOW: string =
  process.env['CONTEST_END'] ?? '2026-03-29';
