import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import pool from '../db/pool.js';
import { authPreHandler } from '../middleware/auth.js';
import type { UserRow, DepositUpdateRow } from '../types.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns ISO date string (YYYY-MM-DD) in Moscow timezone (UTC+3). */
function getMoscowDateStr(): string {
  const now = new Date();
  const moscowMs = now.getTime() + 3 * 60 * 60 * 1000;
  return new Date(moscowMs).toISOString().slice(0, 10);
}

// ─── Currency mapping ────────────────────────────────────────────────────────

const MARKET_CURRENCY: Record<string, string> = {
  crypto: 'USDT',
  moex: 'RUB',
  forex: 'USD',
};

// ─── Zod schemas ────────────────────────────────────────────────────────────

const RegisterBodySchema = z.object({
  displayName: z.string().min(1).max(128),
  avatarUrl: z.string().url().optional().nullable(),
  market: z.enum(['crypto', 'moex', 'forex']),
  instruments: z.array(z.string().min(1)).min(1),
  initialDeposit: z.number().positive().multipleOf(0.01),
});

const UpdateProfileBodySchema = z.object({
  display_name: z.string().min(1).max(128).optional(),
  // Accept both http(s) URLs and base64 data URIs for user-uploaded photos
  photo_url: z.string().nullable().optional(),
});

const TelegramIdParamSchema = z.object({
  telegramId: z.string().regex(/^\d+$/, 'Must be a numeric telegram ID'),
});

// ─── Route plugin ───────────────────────────────────────────────────────────

export async function userRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/user/:telegramId/status
   * Returns flat UserStatus compatible with frontend expectations.
   */
  fastify.get(
    '/api/user/:telegramId/status',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const paramParse = TelegramIdParamSchema.safeParse(request.params);
      if (!paramParse.success) {
        return reply.code(400).send({ error: 'Invalid telegramId parameter' });
      }

      const { telegramId } = paramParse.data;

      try {
        const result = await pool.query<UserRow>(
          `SELECT id, telegram_id, username, display_name, photo_url, market,
                  instruments, initial_deposit, currency, registered_at,
                  consented_pd, consented_rules
           FROM users
           WHERE telegram_id = $1`,
          [telegramId],
        );

        if (result.rowCount === 0) {
          return reply.code(200).send({
            registered: false,
            depositUpdatedToday: false,
            telegramId: parseInt(telegramId),
            displayName: '',
            market: null,
            instruments: [],
            initialDeposit: 0,
            currency: 'USDT',
            avatarUrl: null,
          });
        }

        const user = result.rows[0]!;
        const today = getMoscowDateStr();

        const depositResult = await pool.query<{ has_today: boolean }>(
          `SELECT EXISTS(
             SELECT 1 FROM deposit_updates WHERE user_id = $1 AND deposit_date = $2
           ) AS has_today`,
          [user.id, today],
        );
        const depositUpdatedToday = depositResult.rows[0]?.has_today ?? false;

        return reply.code(200).send({
          registered: true,
          depositUpdatedToday,
          telegramId: parseInt(user.telegram_id),
          displayName: user.display_name,
          market: user.market,
          instruments: user.instruments,
          initialDeposit: parseFloat(user.initial_deposit),
          currency: user.currency,
          avatarUrl: user.photo_url,
        });
      } catch (err) {
        request.log.error({ err }, 'Failed to fetch user status');
        return reply.code(500).send({ error: 'Internal server error' });
      }
    },
  );

  /**
   * POST /api/user/register
   * Accepts camelCase body from frontend. Returns flat UserStatus.
   */
  fastify.post(
    '/api/user/register',
    { preHandler: authPreHandler },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const bodyParse = RegisterBodySchema.safeParse(request.body);
      if (!bodyParse.success) {
        return reply.code(400).send({
          error: 'Validation failed',
          details: bodyParse.error.flatten().fieldErrors,
        });
      }

      const body = bodyParse.data;
      const { id: telegramId, username } = request.telegramUser;
      const currency = MARKET_CURRENCY[body.market] ?? 'USDT';

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const existing = await client.query<{ id: number }>(
          'SELECT id FROM users WHERE telegram_id = $1',
          [telegramId],
        );
        if ((existing.rowCount ?? 0) > 0) {
          await client.query('ROLLBACK');
          return reply.code(409).send({ error: 'User already registered' });
        }

        const insertUser = await client.query<UserRow>(
          `INSERT INTO users
             (telegram_id, username, display_name, photo_url, market, instruments,
              initial_deposit, currency, consented_pd, consented_rules)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10)
           RETURNING id, telegram_id, username, display_name, photo_url, market,
                     instruments, initial_deposit, currency, registered_at,
                     consented_pd, consented_rules`,
          [
            telegramId,
            username ?? null,
            body.displayName,
            body.avatarUrl ?? null,
            body.market,
            JSON.stringify(body.instruments),
            body.initialDeposit,
            currency,
            true, // implicit consent
            true,
          ],
        );

        const newUser = insertUser.rows[0]!;
        const today = getMoscowDateStr();

        await client.query(
          `INSERT INTO deposit_updates (user_id, deposit_date, deposit_value)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, deposit_date) DO NOTHING`,
          [newUser.id, today, body.initialDeposit],
        );

        await client.query('COMMIT');

        return reply.code(201).send({
          registered: true,
          depositUpdatedToday: true,
          telegramId: parseInt(newUser.telegram_id),
          displayName: newUser.display_name,
          market: newUser.market,
          instruments: newUser.instruments,
          initialDeposit: parseFloat(newUser.initial_deposit),
          currency: newUser.currency,
          avatarUrl: newUser.photo_url,
        });
      } catch (err) {
        await client.query('ROLLBACK');
        request.log.error({ err }, 'Failed to register user');
        return reply.code(500).send({ error: 'Internal server error' });
      } finally {
        client.release();
      }
    },
  );

  /**
   * PATCH /api/user/:telegramId/profile
   * Requires auth. Only the authenticated user may edit their own profile.
   */
  fastify.patch(
    '/api/user/:telegramId/profile',
    { preHandler: authPreHandler },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const paramParse = TelegramIdParamSchema.safeParse(request.params);
      if (!paramParse.success) {
        return reply.code(400).send({ error: 'Invalid telegramId parameter' });
      }

      const bodyParse = UpdateProfileBodySchema.safeParse(request.body);
      if (!bodyParse.success) {
        return reply.code(400).send({
          error: 'Validation failed',
          details: bodyParse.error.flatten().fieldErrors,
        });
      }

      const { telegramId } = paramParse.data;

      if (String(request.telegramUser.id) !== telegramId) {
        return reply.code(403).send({ error: 'Forbidden' });
      }

      const body = bodyParse.data;
      if (!body.display_name && body.photo_url === undefined) {
        return reply.code(400).send({ error: 'No fields to update' });
      }

      const setClauses: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      if (body.display_name !== undefined) {
        setClauses.push(`display_name = $${idx++}`);
        values.push(body.display_name);
      }
      if (body.photo_url !== undefined) {
        setClauses.push(`photo_url = $${idx++}`);
        values.push(body.photo_url);
      }

      values.push(telegramId);
      const whereIdx = idx;

      try {
        const result = await pool.query<UserRow>(
          `UPDATE users
           SET ${setClauses.join(', ')}
           WHERE telegram_id = $${whereIdx}
           RETURNING id, telegram_id, username, display_name, photo_url, market,
                     instruments, initial_deposit, currency, registered_at,
                     consented_pd, consented_rules`,
          values,
        );

        if (result.rowCount === 0) {
          return reply.code(404).send({ error: 'User not found' });
        }

        const user = result.rows[0]!;
        return reply.code(200).send({
          registered: true,
          telegramId: parseInt(user.telegram_id),
          displayName: user.display_name,
          market: user.market,
          instruments: user.instruments,
          initialDeposit: parseFloat(user.initial_deposit),
          currency: user.currency,
          avatarUrl: user.photo_url,
        });
      } catch (err) {
        request.log.error({ err }, 'Failed to update user profile');
        return reply.code(500).send({ error: 'Internal server error' });
      }
    },
  );

  /**
   * GET /api/user/:telegramId/history
   * Returns computed HistoryResponse compatible with frontend expectations.
   */
  fastify.get(
    '/api/user/:telegramId/history',
    { preHandler: authPreHandler },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const paramParse = TelegramIdParamSchema.safeParse(request.params);
      if (!paramParse.success) {
        return reply.code(400).send({ error: 'Invalid telegramId parameter' });
      }

      const { telegramId } = paramParse.data;

      try {
        const userResult = await pool.query<{
          id: number;
          initial_deposit: string;
          currency: string;
        }>(
          'SELECT id, initial_deposit, currency FROM users WHERE telegram_id = $1',
          [telegramId],
        );
        if (userResult.rowCount === 0) {
          return reply.code(404).send({ error: 'User not found' });
        }

        const user = userResult.rows[0]!;
        const userId = user.id;
        const initialDeposit = parseFloat(user.initial_deposit);
        const currency = user.currency;

        const result = await pool.query<DepositUpdateRow>(
          `SELECT id, user_id, deposit_date::text, deposit_value, created_at, updated_at
           FROM deposit_updates
           WHERE user_id = $1
           ORDER BY deposit_date ASC`,
          [userId],
        );

        const rows = result.rows;
        const daysParticipated = rows.length;

        const entries = rows.map((row, i) => {
          const amount = parseFloat(row.deposit_value);
          const prevAmount = i > 0 ? parseFloat(rows[i - 1]!.deposit_value) : null;
          const dailyChange =
            prevAmount !== null && prevAmount > 0
              ? parseFloat(((amount - prevAmount) / prevAmount * 100).toFixed(2))
              : null;
          const parts = row.deposit_date.split('-');
          const dateLabel =
            parts.length === 3 ? `${parts[2]}.${parts[1]}` : row.deposit_date;
          return {
            date: row.deposit_date,
            dateLabel,
            amount,
            dailyChange,
          };
        });

        const currentDeposit =
          rows.length > 0
            ? parseFloat(rows[rows.length - 1]!.deposit_value)
            : initialDeposit;
        const pnlAbsolute = parseFloat((currentDeposit - initialDeposit).toFixed(2));
        const pnlPercent =
          initialDeposit > 0
            ? parseFloat(
                ((currentDeposit - initialDeposit) / initialDeposit * 100).toFixed(2),
              )
            : 0;

        return reply.code(200).send({
          daysParticipated,
          initialDeposit,
          currentDeposit,
          pnlPercent,
          pnlAbsolute,
          currency,
          entries,
        });
      } catch (err) {
        request.log.error({ err }, 'Failed to fetch deposit history');
        return reply.code(500).send({ error: 'Internal server error' });
      }
    },
  );
}
