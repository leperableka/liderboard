import cron from 'node-cron';
import { Bot, InlineKeyboard } from 'grammy';
import pool from '../db/pool.js';

interface PendingUser {
  telegram_id: string;
  display_name: string;
  market: 'crypto' | 'moex' | 'forex';
}

/**
 * Sends deposit reminders to all users who have not submitted a deposit update
 * for "today" (UTC date at the time the cron fires).
 *
 * Business rules:
 *  - crypto: runs every day (Mon–Sun)
 *  - moex / forex: runs Mon–Fri only
 *  - A user is excluded if they already have a deposit_updates row for today
 */
async function sendDepositReminders(bot: Bot, miniAppUrl: string): Promise<void> {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const dayOfWeek = today.getUTCDay(); // 0=Sun, 1=Mon … 6=Sat
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

  console.log(`[notifications] Running deposit reminders for ${todayStr}, isWeekday=${isWeekday}`);

  try {
    /*
     * Select users who:
     *  1. Are in the correct market for today's schedule.
     *  2. Do NOT have a deposit record for today.
     */
    const result = await pool.query<PendingUser>(
      `SELECT u.telegram_id, u.display_name, u.market
       FROM users u
       WHERE
         -- crypto users always included; moex/forex only on weekdays
         (u.market = 'crypto' OR $1 = TRUE)
         -- exclude those who already submitted today
         AND NOT EXISTS (
           SELECT 1
           FROM deposit_updates du
           WHERE du.user_id = u.id
             AND du.deposit_date = $2
         )`,
      [isWeekday, todayStr],
    );

    const users = result.rows;
    console.log(`[notifications] ${users.length} users to notify`);

    if (users.length === 0) return;

    const keyboard = new InlineKeyboard().webApp('Внести данные', miniAppUrl);

    // Send messages sequentially to avoid hitting Telegram rate limits (30 msg/s)
    for (const user of users) {
      // Skip moex/forex users on weekends (crypto already handled via SQL)
      if (user.market !== 'crypto' && !isWeekday) continue;

      const text =
        `Привет, ${user.display_name}!\n\n` +
        `Не забудьте обновить ваш депозит сегодня!\n` +
        `Внесите данные о вашем текущем депозите, чтобы сохранить позицию в лидерборде.`;

      try {
        await bot.api.sendMessage(user.telegram_id, text, {
          reply_markup: keyboard,
        });
      } catch (msgErr) {
        // Log per-user errors without aborting the entire batch
        console.error(
          `[notifications] Failed to send message to ${user.telegram_id}:`,
          msgErr,
        );
      }

      // Small delay between sends: ~30 messages/sec limit
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    console.log('[notifications] Reminder batch complete');
  } catch (err) {
    console.error('[notifications] Failed to query pending users:', err);
  }
}

/**
 * Schedules the notification cron job.
 *
 * Fires at 15:55 UTC every day (= 18:55 MSK, i.e. ~5 minutes before 19:00 MSK
 * to account for processing time and allow messages to arrive by 19:00).
 *
 * Cron expression: "55 15 * * *"
 *   55 — minute 55
 *   15 — hour 15 (UTC)
 *    * — any day of month
 *    * — any month
 *    * — any day of week  (weekday filtering is done in the handler)
 */
export function scheduleNotifications(bot: Bot, miniAppUrl: string): cron.ScheduledTask {
  const task = cron.schedule(
    '55 15 * * *',
    () => {
      sendDepositReminders(bot, miniAppUrl).catch((err) => {
        console.error('[notifications] Unhandled error in reminder job:', err);
      });
    },
    {
      timezone: 'UTC',
    },
  );

  console.log('[notifications] Cron job scheduled: 15:55 UTC daily');
  return task;
}
