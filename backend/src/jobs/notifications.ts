import cron from 'node-cron';
import { Bot, InlineKeyboard } from 'grammy';
import type { FastifyBaseLogger } from 'fastify';
import pool from '../db/pool.js';
import { getMoscowDateStr, isWeekdayMoscow } from '../utils/time.js';
import { CONTEST_START_MOSCOW, CONTEST_END_MOSCOW } from '../config.js';
import { generateWebUrl } from '../utils/webtoken.js';

function makeKeyboard(url: string) {
  return new InlineKeyboard().webApp('🏆 Открыть приложение', url).primary();
}

/**
 * Creates a keyboard with both WebApp button and a fallback "Open as website"
 * link for users behind MTProto proxy where WebView doesn't load.
 */
function makeKeyboardWithFallback(miniAppUrl: string, telegramId: string): InlineKeyboard {
  const botToken = process.env['BOT_TOKEN'];
  if (!botToken) {
    return makeKeyboard(miniAppUrl);
  }
  const webUrl = generateWebUrl(telegramId, botToken, miniAppUrl);
  return new InlineKeyboard()
    .webApp('🏆 Открыть приложение', miniAppUrl).row()
    .url('🌐 Открыть как сайт', webUrl);
}

interface PendingUser {
  telegram_id: string;
  display_name: string;
  market: 'crypto' | 'moex' | 'forex';
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

/**
 * Sends a batch of messages to users.
 * Respects Telegram's ~30 msg/s limit via 50 ms delay between sends.
 */
async function sendBatch(
  bot: Bot,
  users: PendingUser[],
  getText: (u: PendingUser) => string,
  miniAppUrl: string,
  log: FastifyBaseLogger,
): Promise<void> {
  for (const user of users) {
    try {
      await bot.api.sendMessage(user.telegram_id, getText(user), {
        reply_markup: makeKeyboardWithFallback(miniAppUrl, user.telegram_id),
      });
    } catch (err) {
      log.error({ err, telegramId: user.telegram_id }, '[notifications] Failed to send message');
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
       -- only after contest start (2 March 2026 00:00 МСК)
       (NOW() AT TIME ZONE 'Europe/Moscow')::date >= $3::date
       -- market filter: crypto always, moex/forex on weekdays only
       AND (u.market = 'crypto' OR $1 = TRUE)
       -- not submitted today (Moscow date)
       AND NOT EXISTS (
         SELECT 1 FROM deposit_updates du
         WHERE du.user_id = u.id AND du.deposit_date = $2
       )
       -- active window: < 5 days since last deposit or contest start (not registration date)
       -- GREATEST ensures users registered before contest start get full 5-day window from day 1
       AND (
         (NOW() AT TIME ZONE 'Europe/Moscow')::date - GREATEST(
           COALESCE(
             (SELECT MAX(du2.deposit_date) FROM deposit_updates du2 WHERE du2.user_id = u.id),
             u.registered_at::date
           ),
           $3::date
         ) < 5
       )`,
    [weekday, todayStr, CONTEST_START_MOSCOW],
  );

  return result.rows;
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
       -- only after contest start
       (NOW() AT TIME ZONE 'Europe/Moscow')::date >= $1::date
       -- exactly 4 days inactive since last deposit or contest start (not registration)
       AND (NOW() AT TIME ZONE 'Europe/Moscow')::date - GREATEST(
         COALESCE(
           (SELECT MAX(du.deposit_date) FROM deposit_updates du WHERE du.user_id = u.id),
           u.registered_at::date
         ),
         $1::date
       ) = 4`,
    [CONTEST_START_MOSCOW],
  );

  return result.rows;
}

// ─── Reminder jobs ───────────────────────────────────────────────────────────

/**
 * 1st reminder — 15:55 UTC (18:55 МСК)
 * ~5 minutes before market close. Standard nudge.
 */
async function sendPreCloseReminders(bot: Bot, miniAppUrl: string, log: FastifyBaseLogger): Promise<void> {
  const todayStr = getMoscowDateStr();
  if (todayStr > CONTEST_END_MOSCOW) {
    log.info(`[notifications] Pre-close skipped: contest ended ${CONTEST_END_MOSCOW}`);
    return;
  }
  log.info(`[notifications] Pre-close reminder — ${todayStr} (Moscow)`);

  try {
    const users = await getPendingUsers();
    log.info(`[notifications] Pre-close: ${users.length} users to notify`);
    if (users.length === 0) return;

    await sendBatch(
      bot,
      users,
      (u) =>
        `Добрый день, ${u.display_name}!\n\n` +
        `Не забудьте обновить данные депозита за сегодня. Это поможет сохранить корректную позицию в турнире.\n` +
        `Регулярное обновление данных — важная часть участия. Желаем удачных сделок! 📈`,
      miniAppUrl,
      log,
    );

    log.info('[notifications] Pre-close batch complete');
  } catch (err) {
    log.error({ err }, '[notifications] Pre-close error');
  }
}

/**
 * 2nd reminder — 17:00 UTC (20:00 МСК)
 * Evening nudge for those who still haven't submitted.
 */
async function sendEveningReminders(bot: Bot, miniAppUrl: string, log: FastifyBaseLogger): Promise<void> {
  const todayStr = getMoscowDateStr();
  if (todayStr > CONTEST_END_MOSCOW) {
    log.info(`[notifications] Evening skipped: contest ended ${CONTEST_END_MOSCOW}`);
    return;
  }
  log.info(`[notifications] Evening reminder — ${todayStr} (Moscow)`);

  try {
    const users = await getPendingUsers();
    log.info(`[notifications] Evening: ${users.length} users to notify`);
    if (users.length === 0) return;

    await sendBatch(
      bot,
      users,
      () =>
        `Вы не заполнили данные торгового турнира Vesperfin&Co.Trading, ` +
        `пожалуйста, зайдите в приложение и внесите информацию.\n\n` +
        `Возможно, вы уже лидируете в турнире 🏆`,
      miniAppUrl,
      log,
    );

    log.info('[notifications] Evening batch complete');
  } catch (err) {
    log.error({ err }, '[notifications] Evening error');
  }
}

/**
 * Disqualification warning — 09:00 UTC (12:00 МСК)
 * Sent to users inactive for exactly 4 calendar days.
 * On day 5+ they are silently excluded from all reminders.
 */
async function sendDisqualificationWarnings(bot: Bot, miniAppUrl: string, log: FastifyBaseLogger): Promise<void> {
  const todayStr = getMoscowDateStr();
  if (todayStr > CONTEST_END_MOSCOW) {
    log.info(`[notifications] Disqualification skipped: contest ended ${CONTEST_END_MOSCOW}`);
    return;
  }
  log.info(`[notifications] Disqualification warning — ${todayStr} (Moscow)`);

  try {
    const users = await getDisqualificationWarningUsers();
    log.info(`[notifications] Disqualification warning: ${users.length} users`);
    if (users.length === 0) return;

    await sendBatch(
      bot,
      users,
      () =>
        `Добрый день!\n\n` +
        `К сожалению, вы не вносите данные торгового турнира Vesperfin&Co.Trading. ` +
        `Мы будем вынуждены дисквалифицировать ваш профиль из турнирной таблицы.`,
      miniAppUrl,
      log,
    );

    log.info('[notifications] Disqualification warning batch complete');
  } catch (err) {
    log.error({ err }, '[notifications] Disqualification warning error');
  }
}

/**
 * Returns users who have been inactive for EXACTLY 6 calendar days —
 * meaning they will be deactivated tomorrow (day 7) if they don't submit.
 */
async function getDeactivationWarningUsers(): Promise<PendingUser[]> {
  const result = await pool.query<PendingUser>(
    `SELECT u.telegram_id, u.display_name, u.market
     FROM users u
     WHERE
       (NOW() AT TIME ZONE 'Europe/Moscow')::date >= $1::date
       AND (NOW() AT TIME ZONE 'Europe/Moscow')::date - GREATEST(
         COALESCE(
           (SELECT MAX(du.deposit_date) FROM deposit_updates du WHERE du.user_id = u.id),
           u.registered_at::date
         ),
         $1::date
       ) = 6`,
    [CONTEST_START_MOSCOW],
  );
  return result.rows;
}

/**
 * Returns users who have been inactive for EXACTLY 7 calendar days —
 * meaning their profile becomes deactivated today.
 */
async function getDeactivatedUsers(): Promise<PendingUser[]> {
  const result = await pool.query<PendingUser>(
    `SELECT u.telegram_id, u.display_name, u.market
     FROM users u
     WHERE
       (NOW() AT TIME ZONE 'Europe/Moscow')::date >= $1::date
       AND (NOW() AT TIME ZONE 'Europe/Moscow')::date - GREATEST(
         COALESCE(
           (SELECT MAX(du.deposit_date) FROM deposit_updates du WHERE du.user_id = u.id),
           u.registered_at::date
         ),
         $1::date
       ) = 7`,
    [CONTEST_START_MOSCOW],
  );
  return result.rows;
}

/**
 * Deactivation notice — 10:00 UTC (13:00 МСК)
 * Sent to users who just hit exactly 7 days inactive.
 * Profile is moved to bottom of leaderboard, but user can return by submitting data.
 */
async function sendDeactivationNotices(bot: Bot, miniAppUrl: string, log: FastifyBaseLogger): Promise<void> {
  const todayStr = getMoscowDateStr();
  if (todayStr > CONTEST_END_MOSCOW) {
    log.info(`[notifications] Deactivation notice skipped: contest ended ${CONTEST_END_MOSCOW}`);
    return;
  }
  log.info(`[notifications] Deactivation notice — ${todayStr} (Moscow)`);

  try {
    const users = await getDeactivatedUsers();
    log.info(`[notifications] Deactivation notice: ${users.length} users`);
    if (users.length === 0) return;

    await sendBatch(
      bot,
      users,
      () =>
        `Добрый день!\n\n` +
        `Вы не обновляли данные по депозиту более 7 дней, поэтому мы временно скрыли ваш профиль из турнирной таблицы.\n\n` +
        `Если захотите вернуться — просто внесите актуальные данные по депозиту в приложении, и ваш профиль снова станет активным и появится в таблице.\n\n` +
        `Спасибо! 🙌`,
      miniAppUrl,
      log,
    );

    log.info('[notifications] Deactivation notice batch complete');
  } catch (err) {
    log.error({ err }, '[notifications] Deactivation notice error');
  }
}

/**
 * Deactivation warning — 10:00 UTC (13:00 МСК)
 * Sent to users inactive for exactly 6 calendar days.
 * On day 7 their profile is deactivated (moved to bottom).
 */
async function sendDeactivationWarnings(bot: Bot, miniAppUrl: string, log: FastifyBaseLogger): Promise<void> {
  const todayStr = getMoscowDateStr();
  if (todayStr > CONTEST_END_MOSCOW) {
    log.info(`[notifications] Deactivation skipped: contest ended ${CONTEST_END_MOSCOW}`);
    return;
  }
  log.info(`[notifications] Deactivation warning — ${todayStr} (Moscow)`);

  try {
    const users = await getDeactivationWarningUsers();
    log.info(`[notifications] Deactivation warning: ${users.length} users`);
    if (users.length === 0) return;

    await sendBatch(
      bot,
      users,
      () =>
        `Добрый день!\n\n` +
        `С момента последнего обновления ваших данных прошло 6 дней.\n` +
        `Чтобы продолжить участие в турнире, пожалуйста, внесите актуальный депозит в турнирную таблицу.\n\n` +
        `Если данные не будут обновлены, завтра профиль будет деактивирован, и вы выбываете из турнира.\n\n` +
        `Надеемся увидеть вас снова в таблице участников!`,
      miniAppUrl,
      log,
    );

    log.info('[notifications] Deactivation warning batch complete');
  } catch (err) {
    log.error({ err }, '[notifications] Deactivation warning error');
  }
}

// ─── Scheduler ───────────────────────────────────────────────────────────────

/**
 * Wraps an async cron handler with a mutex flag so that if the previous
 * execution is still running when the next tick fires, the new tick is
 * skipped and a warning is logged instead of running in parallel.
 */
function withMutex(
  name: string,
  fn: () => Promise<void>,
  log: FastifyBaseLogger,
): () => void {
  let running = false;
  return () => {
    if (running) {
      log.warn(`[notifications] ${name} skipped — previous run still in progress`);
      return;
    }
    running = true;
    fn()
      .catch((err) => log.error({ err }, `[notifications] ${name} error`))
      .finally(() => { running = false; });
  };
}

/**
 * Cron schedule (all UTC):
 *  09:00 UTC (12:00 МСК) — disqualification warning for day-4 inactives
 *  10:00 UTC (13:00 МСК) — deactivation warning for day-6 inactives
 *  15:55 UTC (18:55 МСК) — pre-close reminder
 *  17:00 UTC (20:00 МСК) — evening reminder
 */
export function scheduleNotifications(
  bot: Bot,
  miniAppUrl: string,
  log: FastifyBaseLogger,
): { stop: () => void } {
  const disqualTask = cron.schedule(
    '0 9 * * *',
    withMutex('Disqualification', () => sendDisqualificationWarnings(bot, miniAppUrl, log), log),
    { timezone: 'UTC' },
  );

  const deactivateWarnTask = cron.schedule(
    '0 10 * * *',
    withMutex('DeactivationWarning', () => sendDeactivationWarnings(bot, miniAppUrl, log), log),
    { timezone: 'UTC' },
  );

  const deactivateNoticeTask = cron.schedule(
    '5 10 * * *',
    withMutex('DeactivationNotice', () => sendDeactivationNotices(bot, miniAppUrl, log), log),
    { timezone: 'UTC' },
  );

  const preCloseTask = cron.schedule(
    '55 15 * * *',
    withMutex('Pre-close', () => sendPreCloseReminders(bot, miniAppUrl, log), log),
    { timezone: 'UTC' },
  );

  const eveningTask = cron.schedule(
    '0 17 * * *',
    withMutex('Evening', () => sendEveningReminders(bot, miniAppUrl, log), log),
    { timezone: 'UTC' },
  );

  log.info(
    '[notifications] Cron jobs scheduled: ' +
    '09:00 UTC (disqualification warning) + ' +
    '10:00 UTC (deactivation warning day-6) + ' +
    '10:05 UTC (deactivation notice day-7) + ' +
    '15:55 UTC (pre-close) + ' +
    '17:00 UTC (evening)',
  );

  return {
    stop: () => {
      disqualTask.stop();
      deactivateWarnTask.stop();
      deactivateNoticeTask.stop();
      preCloseTask.stop();
      eveningTask.stop();
    },
  };
}
