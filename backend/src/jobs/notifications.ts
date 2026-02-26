import cron from 'node-cron';
import { Bot } from 'grammy';
import pool from '../db/pool.js';

/** Bot API 9.4: inline button with primary (blue) style */
function blueWebAppButton(text: string, url: string) {
  return { text, web_app: { url }, style: 'primary' } as const;
}

function makeKeyboard(text: string, url: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { inline_keyboard: [[blueWebAppButton(text, url) as any]] };
}

interface PendingUser {
  telegram_id: string;
  display_name: string;
  market: 'crypto' | 'moex' | 'forex';
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

/** Returns ISO date string (YYYY-MM-DD) in Moscow timezone (UTC+3). */
function getMoscowDateStr(): string {
  const now = new Date();
  const moscowMs = now.getTime() + 3 * 60 * 60 * 1000;
  return new Date(moscowMs).toISOString().slice(0, 10);
}

/** Returns true if today is Mon–Fri in Moscow timezone. */
function isWeekdayMoscow(): boolean {
  const now = new Date();
  const moscowMs = now.getTime() + 3 * 60 * 60 * 1000;
  const day = new Date(moscowMs).getUTCDay(); // 0=Sun … 6=Sat
  return day >= 1 && day <= 5;
}

/**
 * Sends a batch of messages to users.
 * Respects Telegram's ~30 msg/s limit via 50 ms delay between sends.
 */
async function sendBatch(
  bot: Bot,
  users: PendingUser[],
  getText: (u: PendingUser) => string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keyboard: any,
): Promise<void> {
  for (const user of users) {
    try {
      await bot.api.sendMessage(user.telegram_id, getText(user), {
        reply_markup: keyboard,
      });
    } catch (err) {
      console.error(`[notifications] Failed to send to ${user.telegram_id}:`, err);
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

// ─── Query helpers ───────────────────────────────────────────────────────────

/**
 * Returns users who have NOT submitted today AND are still within the
 * active window (< 5 days since last submission / registration).
 *
 * Business rules:
 *  - crypto: every day
 *  - moex / forex: Mon–Fri only
 *  - Users inactive for 5+ calendar days are excluded (they get no more reminders)
 */
async function getPendingUsers(): Promise<PendingUser[]> {
  const todayStr = getMoscowDateStr();
  const weekday = isWeekdayMoscow();

  const result = await pool.query<PendingUser>(
    `SELECT u.telegram_id, u.display_name, u.market
     FROM users u
     WHERE
       -- market filter: crypto always, moex/forex on weekdays only
       (u.market = 'crypto' OR $1 = TRUE)
       -- not submitted today (Moscow date)
       AND NOT EXISTS (
         SELECT 1 FROM deposit_updates du
         WHERE du.user_id = u.id AND du.deposit_date = $2
       )
       -- active window: fewer than 5 days since last deposit or registration (Moscow time)
       AND (
         (NOW() AT TIME ZONE 'Europe/Moscow')::date - COALESCE(
           (SELECT MAX(du2.deposit_date) FROM deposit_updates du2 WHERE du2.user_id = u.id),
           u.registered_at::date
         ) < 5
       )`,
    [weekday, todayStr],
  );

  return result.rows.filter((u) => u.market === 'crypto' || weekday);
}

/**
 * Returns users who have been inactive for EXACTLY 4 calendar days —
 * meaning they should receive the disqualification warning today.
 *
 * Days_inactive is calculated as:
 *   CURRENT_DATE − MAX(deposit_date)   if the user has ever submitted
 *   CURRENT_DATE − registered_at::date if the user never submitted
 */
async function getDisqualificationWarningUsers(): Promise<PendingUser[]> {
  const result = await pool.query<PendingUser>(
    `SELECT u.telegram_id, u.display_name, u.market
     FROM users u
     WHERE
       (NOW() AT TIME ZONE 'Europe/Moscow')::date - COALESCE(
         (SELECT MAX(du.deposit_date) FROM deposit_updates du WHERE du.user_id = u.id),
         u.registered_at::date
       ) = 4`,
  );

  return result.rows;
}

// ─── Reminder jobs ───────────────────────────────────────────────────────────

/**
 * 1st reminder — 15:55 UTC (18:55 МСК)
 * ~5 minutes before market close. Standard nudge.
 */
async function sendPreCloseReminders(bot: Bot, miniAppUrl: string): Promise<void> {
  const todayStr = getMoscowDateStr();
  console.log(`[notifications] Pre-close reminder — ${todayStr} (Moscow)`);

  try {
    const users = await getPendingUsers();
    console.log(`[notifications] Pre-close: ${users.length} users to notify`);
    if (users.length === 0) return;

    await sendBatch(
      bot,
      users,
      (u) =>
        `Привет, ${u.display_name}!\n\n` +
        `Не забудьте обновить ваш депозит сегодня!\n` +
        `Внесите данные о вашем текущем депозите, чтобы сохранить позицию в лидерборде.`,
      makeKeyboard('Внести данные', miniAppUrl),
    );

    console.log('[notifications] Pre-close batch complete');
  } catch (err) {
    console.error('[notifications] Pre-close error:', err);
  }
}

/**
 * 2nd reminder — 17:00 UTC (20:00 МСК)
 * Evening nudge for those who still haven't submitted.
 */
async function sendEveningReminders(bot: Bot, miniAppUrl: string): Promise<void> {
  const todayStr = getMoscowDateStr();
  console.log(`[notifications] Evening reminder — ${todayStr} (Moscow)`);

  try {
    const users = await getPendingUsers();
    console.log(`[notifications] Evening: ${users.length} users to notify`);
    if (users.length === 0) return;

    await sendBatch(
      bot,
      users,
      () =>
        `Вы не заполнили данные торгового чемпионата Vesperfin&Co.Trading, ` +
        `пожалуйста, зайдите в приложение и внесите информацию.\n\n` +
        `Возможно, вы уже лидируете в турнире 🏆`,
      makeKeyboard('Открыть приложение', miniAppUrl),
    );

    console.log('[notifications] Evening batch complete');
  } catch (err) {
    console.error('[notifications] Evening error:', err);
  }
}

/**
 * Disqualification warning — 09:00 UTC (12:00 МСК)
 * Sent to users inactive for exactly 4 calendar days.
 * On day 5+ they are silently excluded from all reminders.
 */
async function sendDisqualificationWarnings(bot: Bot, miniAppUrl: string): Promise<void> {
  const todayStr = getMoscowDateStr();
  console.log(`[notifications] Disqualification warning — ${todayStr} (Moscow)`);

  try {
    const users = await getDisqualificationWarningUsers();
    console.log(`[notifications] Disqualification warning: ${users.length} users`);
    if (users.length === 0) return;

    await sendBatch(
      bot,
      users,
      () =>
        `Добрый день!\n\n` +
        `К сожалению, вы не вносите данные торгового чемпионата Vesperfin&Co.Trading. ` +
        `Мы будем вынуждены дисквалифицировать ваш профиль из турнирной таблицы.`,
      makeKeyboard('Внести данные', miniAppUrl),
    );

    console.log('[notifications] Disqualification warning batch complete');
  } catch (err) {
    console.error('[notifications] Disqualification warning error:', err);
  }
}

// ─── Scheduler ───────────────────────────────────────────────────────────────

/**
 * Cron schedule (all UTC):
 *  09:00 UTC (12:00 МСК) — disqualification warning for day-4 inactives
 *  15:55 UTC (18:55 МСК) — pre-close reminder
 *  17:00 UTC (20:00 МСК) — evening reminder
 */
export function scheduleNotifications(
  bot: Bot,
  miniAppUrl: string,
): { stop: () => void } {
  const disqualTask = cron.schedule(
    '0 9 * * *',
    () => sendDisqualificationWarnings(bot, miniAppUrl).catch(console.error),
    { timezone: 'UTC' },
  );

  const preCloseTask = cron.schedule(
    '55 15 * * *',
    () => sendPreCloseReminders(bot, miniAppUrl).catch(console.error),
    { timezone: 'UTC' },
  );

  const eveningTask = cron.schedule(
    '0 17 * * *',
    () => sendEveningReminders(bot, miniAppUrl).catch(console.error),
    { timezone: 'UTC' },
  );

  console.log(
    '[notifications] Cron jobs scheduled: ' +
    '09:00 UTC (disqualification warning) + ' +
    '15:55 UTC (pre-close) + ' +
    '17:00 UTC (evening)',
  );

  return {
    stop: () => {
      disqualTask.stop();
      preCloseTask.stop();
      eveningTask.stop();
    },
  };
}
