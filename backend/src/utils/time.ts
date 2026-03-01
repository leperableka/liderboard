/** Returns ISO date string (YYYY-MM-DD) in Moscow timezone (UTC+3). */
export function getMoscowDateStr(): string {
  const now = new Date();
  const moscowMs = now.getTime() + 3 * 60 * 60 * 1000;
  return new Date(moscowMs).toISOString().slice(0, 10);
}

/** Returns true if today is Mon–Fri in Moscow timezone. */
export function isWeekdayMoscow(): boolean {
  const now = new Date();
  const moscowMs = now.getTime() + 3 * 60 * 60 * 1000;
  const day = new Date(moscowMs).getUTCDay(); // 0=Sun … 6=Sat
  return day >= 1 && day <= 5;
}
