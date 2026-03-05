import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { Bot, InlineKeyboard } from 'grammy';
import pool from '../db/pool.js';
import { authPreHandler } from '../middleware/auth.js';
import { cacheDelPattern, cacheGet, cacheSet } from '../services/cache.js';
import { getUserPosition, getUserCategory } from '../services/position.js';
import { getMoscowDateStr } from '../utils/time.js';
import { CONTEST_END_MOSCOW } from '../config.js';

// ─── Zod schema ─────────────────────────────────────────────────────────────

const DepositUpdateBodySchema = z.object({
  deposit_value: z.number().positive().max(10_000_000).transform((v) => Math.round(v * 100) / 100),
});

// ─── Plugin options ─────────────────────────────────────────────────────────

interface DepositRouteOpts {
  bot?: Bot;
  miniAppUrl?: string;
}

// ─── Top-3 congratulation messages ──────────────────────────────────────────

const CATEGORY_MESSAGES: Record<number, string> = {
  1: 'Поздравляем! 🎉 Вы заняли первое место в своей категории — отличный результат и сильная работа. Так держать!',
  2: 'Поздравляем! 👏 Вы заняли второе место в своей категории — достойный результат и хорошая динамика. Продолжайте в том же духе!',
  3: 'Поздравляем! 🔥 Вы заняли третье место в своей категории — уверенный финиш и заслуженное место в тройке лидеров!',
};

const OVERALL_MESSAGES: Record<number, string> = {
  1: 'Поздравляем! 🚀 Вы заняли первое место в общей таблице турнира — лучший результат среди всех участников. Сильная стратегия и отличная дисциплина!',
  2: 'Поздравляем! 💪 Вы заняли второе место в общей таблице турнира — выдающийся результат и высокий уровень конкуренции позади!',
  3: 'Поздравляем! 🎯 Вы заняли третье место в общей таблице турнира — вы в числе лучших участников турнира!',
};

// ─── Notification logic (fire-and-forget) ───────────────────────────────────

async function notifyAfterDeposit(
  bot: Bot,
  miniAppUrl: string,
  telegramId: number,
  log: FastifyRequest['log'],
): Promise<void> {
  const keyboard = new InlineKeyboard().webApp('🏆 Открыть приложение', miniAppUrl).primary();

  // 1. Thank-you message (always)
  try {
    await bot.api.sendMessage(
      telegramId,
      'Спасибо, что внесли свои данные! 🙌\n' +
      'Мы обновили вашу позицию в турнире — результаты уже учтены в таблице. Продолжайте в том же темпе 🚀',
      { reply_markup: keyboard },
    );
  } catch (err) {
    log.warn({ err, telegramId }, '[deposit-notify] Failed to send thank-you message');
    return; // If we can't send basic message, skip top-3 check too
  }

  // 2. Check top-3 positions
  const today = getMoscowDateStr();

  try {
    // 2a. Overall ranking
    const overallPos = await getUserPosition(telegramId, null, today);
    if (overallPos !== null && overallPos <= 3) {
      await maybeSendCongrats(
        bot, telegramId, keyboard,
        `top3:overall:${telegramId}`, overallPos,
        OVERALL_MESSAGES, log,
      );
    }

    // 2b. Category ranking
    const userCategory = await getUserCategory(telegramId);
    if (userCategory !== null) {
      const catPos = await getUserPosition(telegramId, userCategory, today);
      if (catPos !== null && catPos <= 3) {
        await maybeSendCongrats(
          bot, telegramId, keyboard,
          `top3:cat:${userCategory}:${telegramId}`, catPos,
          CATEGORY_MESSAGES, log,
        );
      }
    }
  } catch (err) {
    log.warn({ err, telegramId }, '[deposit-notify] Failed to check top-3 positions');
  }
}

/**
 * Sends a congratulation message only if the user hasn't been notified
 * for this position yet (or has improved their position).
 */
async function maybeSendCongrats(
  bot: Bot,
  telegramId: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keyboard: any,
  redisKey: string,
  position: number,
  messages: Record<number, string>,
  log: FastifyRequest['log'],
): Promise<void> {
  try {
    const lastNotified = await cacheGet(redisKey);
    const lastPos = lastNotified ? parseInt(lastNotified, 10) : null;

    // Only send if never notified OR position improved (lower number = better)
    if (lastPos !== null && lastPos <= position) return;

    const text = messages[position];
    if (!text) return;

    await bot.api.sendMessage(telegramId, text, { reply_markup: keyboard });

    // Store without TTL — persists for the duration of the tournament
    await cacheSet(redisKey, String(position), 60 * 60 * 24 * 60); // 60 days TTL
    log.info({ telegramId, position, scope: redisKey }, '[deposit-notify] Sent top-3 congrats');
  } catch (err) {
    log.warn({ err, telegramId, redisKey }, '[deposit-notify] Failed to send congrats');
  }
}

// ─── Route plugin ─────────────────────────────────────────────────────────────

export async function depositRoutes(fastify: FastifyInstance, opts: DepositRouteOpts): Promise<void> {
  const { bot, miniAppUrl } = opts;

  /**
   * POST /api/deposit/update
   *
   * UPSERTs a deposit record for the authenticated user's "today" (honoring
   * client timezone offset).  On success it invalidates all leaderboard cache
   * keys so the next request fetches fresh data.
   */
  fastify.post(
    '/api/deposit/update',
    { preHandler: authPreHandler },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const bodyParse = DepositUpdateBodySchema.safeParse(request.body);
      if (!bodyParse.success) {
        return reply.code(400).send({
          error: 'Validation failed',
          details: bodyParse.error.flatten().fieldErrors,
        });
      }

      const { deposit_value } = bodyParse.data;
      const telegramId = request.telegramUser.id;
      const depositDate = getMoscowDateStr();

      // Block deposit submissions after tournament end
      if (depositDate > CONTEST_END_MOSCOW) {
        return reply.code(403).send({ error: 'Турнир завершён. Внесение данных недоступно.' });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Resolve internal user id
        const userResult = await client.query<{ id: number }>(
          'SELECT id FROM users WHERE telegram_id = $1',
          [telegramId],
        );

        if (userResult.rowCount === 0) {
          await client.query('ROLLBACK');
          return reply.code(404).send({ error: 'User not found. Please register first.' });
        }

        const userId = userResult.rows[0]!.id;

        // UPSERT: insert or update deposit for (user_id, deposit_date)
        await client.query(
          `INSERT INTO deposit_updates (user_id, deposit_date, deposit_value, updated_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (user_id, deposit_date)
           DO UPDATE SET
             deposit_value = EXCLUDED.deposit_value,
             updated_at    = NOW()`,
          [userId, depositDate, deposit_value],
        );

        await client.query('COMMIT');

        // Invalidate leaderboard cache for all periods and pages
        try {
          await cacheDelPattern('leaderboard:*');
        } catch (cacheErr) {
          // Non-fatal: stale cache is acceptable for up to the TTL period
          request.log.warn({ cacheErr }, 'Failed to invalidate leaderboard cache');
        }

        // Fire-and-forget: send Telegram notifications
        if (bot && miniAppUrl) {
          notifyAfterDeposit(bot, miniAppUrl, telegramId, request.log).catch((err) => {
            request.log.warn({ err, telegramId }, '[deposit-notify] Notification error');
          });
        }

        return reply.code(200).send({
          success: true,
          deposit_date: depositDate,
          deposit_value,
        });
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        request.log.error({ err }, 'Failed to update deposit');
        return reply.code(500).send({ error: 'Internal server error' });
      } finally {
        client.release();
      }
    },
  );
}
