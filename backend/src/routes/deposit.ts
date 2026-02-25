import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import pool from '../db/pool.js';
import { authPreHandler } from '../middleware/auth.js';
import { cacheDelPattern } from '../services/cache.js';

// ─── Zod schema ─────────────────────────────────────────────────────────────

const DepositUpdateBodySchema = z.object({
  deposit_value: z.number().positive().multipleOf(0.01),
  /**
   * Optional UTC offset in minutes supplied by the client, e.g. +180 for MSK.
   * Used to derive the "today" date in the user's local timezone.
   * If omitted, UTC date is used.
   */
  user_timezone_offset: z.number().int().min(-840).max(840).optional(),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns an ISO date string (YYYY-MM-DD) for "today" adjusted by the provided
 * UTC offset in minutes.  Falls back to UTC when offset is not provided.
 */
function getTodayForUser(utcOffsetMinutes?: number): string {
  const now = new Date();
  if (utcOffsetMinutes !== undefined) {
    // Shift the timestamp by the user's offset so getUTC* methods return local values
    const localMs = now.getTime() + utcOffsetMinutes * 60_000;
    const localDate = new Date(localMs);
    const y = localDate.getUTCFullYear();
    const m = String(localDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(localDate.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return now.toISOString().slice(0, 10);
}

// ─── Route plugin ─────────────────────────────────────────────────────────────

export async function depositRoutes(fastify: FastifyInstance): Promise<void> {
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

      const { deposit_value, user_timezone_offset } = bodyParse.data;
      const telegramId = request.telegramUser.id;
      const depositDate = getTodayForUser(user_timezone_offset);

      try {
        // Resolve internal user id
        const userResult = await pool.query<{ id: number }>(
          'SELECT id FROM users WHERE telegram_id = $1',
          [telegramId],
        );

        if (userResult.rowCount === 0) {
          return reply.code(404).send({ error: 'User not found. Please register first.' });
        }

        const userId = userResult.rows[0]!.id;

        // UPSERT: insert or update deposit for (user_id, deposit_date)
        await pool.query(
          `INSERT INTO deposit_updates (user_id, deposit_date, deposit_value, updated_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (user_id, deposit_date)
           DO UPDATE SET
             deposit_value = EXCLUDED.deposit_value,
             updated_at    = NOW()`,
          [userId, depositDate, deposit_value],
        );

        // Invalidate leaderboard cache for all periods and pages
        try {
          await cacheDelPattern('leaderboard:*');
        } catch (cacheErr) {
          // Non-fatal: stale cache is acceptable for up to the TTL period
          request.log.warn({ cacheErr }, 'Failed to invalidate leaderboard cache');
        }

        return reply.code(200).send({
          success: true,
          deposit_date: depositDate,
          deposit_value,
        });
      } catch (err) {
        request.log.error({ err }, 'Failed to update deposit');
        return reply.code(500).send({ error: 'Internal server error' });
      }
    },
  );
}
