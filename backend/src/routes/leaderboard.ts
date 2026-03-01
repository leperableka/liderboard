import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import pool from '../db/pool.js';
import {
  cacheGet,
  cacheSet,
} from '../services/cache.js';
import type { LeaderboardEntry } from '../types.js';

// ─── Zod schema ─────────────────────────────────────────────────────────────

const LeaderboardQuerySchema = z.object({
  category: z.enum(['all', '1', '2', '3']).default('all'),
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

// ─── Cache key ───────────────────────────────────────────────────────────────

function cacheKey(category: string, page: number): string {
  return `leaderboard:cat:${category}:${page}`;
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
  deposit_category: number | null;
}

// ─── Moscow time helper ───────────────────────────────────────────────────────

/** Returns ISO date string (YYYY-MM-DD) in Moscow timezone (UTC+3). */
function getMoscowDateStr(): string {
  const now = new Date();
  const moscowMs = now.getTime() + 3 * 60 * 60 * 1000;
  return new Date(moscowMs).toISOString().slice(0, 10);
}

// ─── Route plugin ─────────────────────────────────────────────────────────────

export async function leaderboardRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/leaderboard?category=all|1|2|3&page=1&limit=20
   *
   * Returns participants ranked by P&L % (current vs initial_deposit).
   * Optional category filter (1, 2, 3) by deposit size in RUB.
   * Results are cached in Redis for 60 seconds per (category, page).
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

      const { category, page, limit } = queryParse.data;
      const offset = (page - 1) * limit;

      // Try cache
      const key = cacheKey(category, page);
      try {
        const cached = await cacheGet(key);
        if (cached) {
          return reply.code(200).send(JSON.parse(cached));
        }
      } catch (cacheErr) {
        request.log.warn({ cacheErr }, 'Redis cache read failed, falling back to DB');
      }

      // Use Moscow time so the leaderboard date matches deposit dates (also in MSK)
      const today = getMoscowDateStr();

      // Parameterized category filter: null → no filter, 1/2/3 → filter by category
      const categoryInt: number | null = category !== 'all' ? parseInt(category, 10) : null;

      try {
        /*
         * P&L strategy:
         *   - "current" deposit = latest deposit_value on or before today
         *   - base = initial_deposit (start of contest)
         *   - change_percent = (current - base) / base * 100
         * Sorted by change_percent DESC.
         */
        const sql = `
          WITH
          current_deposits AS (
            SELECT DISTINCT ON (user_id)
              user_id,
              deposit_value AS current_value
            FROM deposit_updates
            WHERE deposit_date <= $1
            ORDER BY user_id, deposit_date DESC
          ),
          today_updates AS (
            SELECT user_id, TRUE AS updated
            FROM deposit_updates
            WHERE deposit_date = $1
          ),
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
              u.deposit_category,
              cd.current_value                             AS current_deposit,
              COALESCE(tu.updated, FALSE)                  AS has_today_update,
              u.registered_at,
              COUNT(*) OVER ()                             AS total_count
            FROM users u
            LEFT JOIN current_deposits  cd  ON cd.user_id = u.id
            LEFT JOIN today_updates     tu  ON tu.user_id = u.id
            WHERE ($4::integer IS NULL OR u.deposit_category = $4::integer)
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
            deposit_category,
            current_deposit::text,
            has_today_update,
            total_count,
            ROUND(
              (
                (COALESCE(current_deposit, initial_deposit::numeric) - initial_deposit::numeric)
                / NULLIF(initial_deposit::numeric, 0)
              ) * 100,
              2
            ) AS change_percent
          FROM ranked
          ORDER BY change_percent DESC NULLS LAST, registered_at ASC
          LIMIT $2 OFFSET $3
        `;

        const result = await pool.query<LeaderboardRow & { change_percent: string }>(
          sql,
          [today, limit, offset, categoryInt],
        );

        const totalCount =
          result.rows.length > 0 ? parseInt(result.rows[0]!.total_count, 10) : 0;

        const entries: LeaderboardEntry[] = result.rows.map((row, index) => ({
          position: offset + index + 1,
          telegramId: parseInt(row.telegram_id),
          displayName: row.display_name,
          avatarUrl: row.photo_url,
          market: row.market,
          instruments: row.instruments,
          pnlPercent: row.change_percent !== null ? parseFloat(row.change_percent) : 0,
          isCurrentUser: false,
          depositCategory: row.deposit_category ?? null,
        }));

        const responseBody = {
          category,
          totalParticipants: totalCount,
          entries,
          currentUser: null,
          page,
          limit,
        };

        try {
          await cacheSet(key, JSON.stringify(responseBody), 60);
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
