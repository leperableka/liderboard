import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import pool from '../db/pool.js';
import {
  cacheGet,
  cacheSet,
  leaderboardCacheKey,
} from '../services/cache.js';
import type { LeaderboardEntry, LeaderboardPeriod } from '../types.js';

// ─── Zod schema ─────────────────────────────────────────────────────────────

const LeaderboardQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month']).default('week'),
  page: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1))
    .default('1'),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
    .default('20'),
});

// ─── Period helpers ──────────────────────────────────────────────────────────

/**
 * Returns the ISO date string (YYYY-MM-DD) for the start of the given period
 * relative to today (UTC).
 */
function getPeriodStart(period: LeaderboardPeriod): string {
  const now = new Date();
  let start: Date;

  switch (period) {
    case 'day': {
      // "day" means the change since yesterday
      start = new Date(now);
      start.setUTCDate(start.getUTCDate() - 1);
      break;
    }
    case 'week': {
      // Monday of the current ISO week
      const dayOfWeek = now.getUTCDay(); // 0=Sun … 6=Sat
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start = new Date(now);
      start.setUTCDate(start.getUTCDate() - daysToMonday);
      break;
    }
    case 'month': {
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      break;
    }
  }

  return start.toISOString().slice(0, 10);
}

// ─── Database row types (internal) ───────────────────────────────────────────

interface LeaderboardRow {
  user_id: number;
  telegram_id: string;
  display_name: string;
  photo_url: string | null;
  market: 'crypto' | 'moex' | 'forex';
  instruments: string[];
  currency: string;
  initial_deposit: string;
  current_deposit: string | null;
  has_today_update: boolean;
  total_count: string;
}

// ─── Route plugin ─────────────────────────────────────────────────────────────

export async function leaderboardRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/leaderboard?period=week&page=1&limit=20
   *
   * Calculates each participant's change_percent relative to the period start,
   * applying the "nearest previous value" fallback, then returns a paginated
   * sorted list. Results are cached in Redis for 60 seconds per (period, page).
   */
  fastify.get(
    '/api/leaderboard',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const queryParse = LeaderboardQuerySchema.safeParse(request.query);
      if (!queryParse.success) {
        return reply.code(400).send({
          error: 'Invalid query parameters',
          details: queryParse.error.flatten().fieldErrors,
        });
      }

      const { period, page, limit } = queryParse.data;
      const offset = (page - 1) * limit;

      // Try cache
      const cacheKey = leaderboardCacheKey(period, page);
      try {
        const cached = await cacheGet(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as {
            data: LeaderboardEntry[];
            total: number;
            page: number;
            limit: number;
          };
          return reply.code(200).send(parsed);
        }
      } catch (cacheErr) {
        // Cache miss or error – proceed to DB
        request.log.warn({ cacheErr }, 'Redis cache read failed, falling back to DB');
      }

      const today = new Date().toISOString().slice(0, 10);
      const periodStart = getPeriodStart(period);

      try {
        /*
         * The SQL strategy:
         *
         * 1. For each user find their "current" deposit = the latest deposit_value
         *    on or before today.
         * 2. For each user find their "period start" deposit = the latest
         *    deposit_value on or before periodStart (fallback to nearest previous).
         * 3. Compute change_percent = (current - start) / start * 100.
         * 4. Mark has_today_update = whether there is a record for exactly today.
         * 5. Sort by change_percent DESC, registered_at ASC, paginate.
         */
        const sql = `
          WITH
          -- Latest deposit on or before today for each user
          current_deposits AS (
            SELECT DISTINCT ON (user_id)
              user_id,
              deposit_value AS current_value,
              deposit_date
            FROM deposit_updates
            WHERE deposit_date <= $1
            ORDER BY user_id, deposit_date DESC
          ),
          -- Latest deposit on or before period start date for each user
          period_start_deposits AS (
            SELECT DISTINCT ON (user_id)
              user_id,
              deposit_value AS start_value
            FROM deposit_updates
            WHERE deposit_date <= $2
            ORDER BY user_id, deposit_date DESC
          ),
          -- Whether the user submitted an update for today
          today_updates AS (
            SELECT user_id, TRUE AS updated
            FROM deposit_updates
            WHERE deposit_date = $1
          ),
          -- Join everything
          ranked AS (
            SELECT
              u.id                                         AS user_id,
              u.telegram_id,
              u.display_name,
              u.photo_url,
              u.market,
              u.instruments,
              u.currency,
              u.initial_deposit,
              cd.current_value                             AS current_deposit,
              COALESCE(tu.updated, FALSE)                  AS has_today_update,
              u.registered_at,
              -- Use period_start deposit as base; fall back to initial_deposit
              COALESCE(psd.start_value, u.initial_deposit) AS base_deposit,
              COUNT(*) OVER ()                             AS total_count
            FROM users u
            LEFT JOIN current_deposits  cd  ON cd.user_id  = u.id
            LEFT JOIN period_start_deposits psd ON psd.user_id = u.id
            LEFT JOIN today_updates     tu  ON tu.user_id  = u.id
          )
          SELECT
            user_id,
            telegram_id,
            display_name,
            photo_url,
            market,
            instruments,
            currency,
            initial_deposit,
            current_deposit::text,
            has_today_update,
            total_count,
            ROUND(
              (
                (COALESCE(current_deposit, base_deposit) - base_deposit)
                / NULLIF(base_deposit, 0)
              ) * 100,
              2
            ) AS change_percent
          FROM ranked
          ORDER BY change_percent DESC NULLS LAST, registered_at ASC
          LIMIT $3 OFFSET $4
        `;

        const result = await pool.query<LeaderboardRow & { change_percent: string }>(
          sql,
          [today, periodStart, limit, offset],
        );

        const totalCount =
          result.rows.length > 0 ? parseInt(result.rows[0]!.total_count, 10) : 0;

        const entries = result.rows.map((row, index) => ({
          position: offset + index + 1,
          telegramId: parseInt(row.telegram_id),
          displayName: row.display_name,
          avatarUrl: row.photo_url,
          market: row.market,
          instruments: row.instruments,
          pnlPercent: row.change_percent !== null ? parseFloat(row.change_percent) : 0,
          isCurrentUser: false, // determined by frontend using telegramId
        }));

        const responseBody = {
          period,
          totalParticipants: totalCount,
          entries,
          currentUser: null, // determined by frontend
          // internal pagination info for caching
          page,
          limit,
        };

        // Cache the result
        try {
          await cacheSet(cacheKey, JSON.stringify(responseBody), 60);
        } catch (cacheErr) {
          request.log.warn({ cacheErr }, 'Redis cache write failed');
        }

        return reply.code(200).send(responseBody);
      } catch (err) {
        request.log.error({ err }, 'Failed to fetch leaderboard');
        return reply.code(500).send({ error: 'Internal server error' });
      }
    },
  );
}
