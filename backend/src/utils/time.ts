const TZ = 'Europe/Moscow';

/** Returns ISO date string (YYYY-MM-DD) in Moscow timezone. */
export function getMoscowDateStr(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

/** Returns true if today is Mon–Fri in Moscow timezone. */
export function isWeekdayMoscow(): boolean {
  const day = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(
    new Date(),
  );
  return day !== 'Sun' && day !== 'Sat';
}
