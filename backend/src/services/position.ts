import pool from '../db/pool.js';
import { CONTEST_START_MOSCOW } from '../config.js';

interface PositionRow {
  row_pos: string;
  deposit_category: number | null;
}

/**
 * Returns the user's position (1-based) in the leaderboard.
 * Inactive users (7+ days without updates) are ranked after all active users.
 *
 * @param telegramId  - Telegram user ID
 * @param categoryInt - null for overall ranking, 1/2/3 for category-specific
 * @param today       - Moscow date string (YYYY-MM-DD) for deposit lookups
 * @returns position number (1 = first place), or null if user not found
 */
export async function getUserPosition(
  telegramId: number,
  categoryInt: number | null,
  today: string,
): Promise<number | null> {
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
    scored AS (
      SELECT
        u.id           AS user_id,
        u.telegram_id,
        u.deposit_category,
        u.registered_at,
        ($1::date - GREATEST(
          COALESCE(
            (SELECT MAX(du.deposit_date) FROM deposit_updates du WHERE du.user_id = u.id),
            u.registered_at::date
          ),
          $4::date
        )) >= 7 AS is_inactive,
        ROUND(
          (
            (COALESCE(cd.current_value, u.initial_deposit::numeric) - u.initial_deposit::numeric)
            / NULLIF(u.initial_deposit::numeric, 0)
          ) * 100,
          2
        ) AS change_percent
      FROM users u
      LEFT JOIN current_deposits cd ON cd.user_id = u.id
      WHERE ($3::integer IS NULL OR u.deposit_category = $3::integer)
    ),
    target AS (
      SELECT * FROM scored WHERE telegram_id = $2
    )
    SELECT
      t.deposit_category,
      (
        SELECT COUNT(*) + 1 FROM scored s
        WHERE
          (s.is_inactive < t.is_inactive)
          OR (s.is_inactive = t.is_inactive AND s.change_percent > t.change_percent)
          OR (s.is_inactive = t.is_inactive AND s.change_percent = t.change_percent AND s.registered_at < t.registered_at)
          OR (s.is_inactive = t.is_inactive AND s.change_percent = t.change_percent AND s.registered_at = t.registered_at AND s.user_id < t.user_id)
      ) AS row_pos
    FROM target t
  `;

  const result = await pool.query<PositionRow>(sql, [today, telegramId, categoryInt, CONTEST_START_MOSCOW]);

  if (result.rows.length === 0) return null;
  return parseInt(result.rows[0]!.row_pos, 10);
}

/**
 * Returns the user's deposit_category from the users table.
 */
export async function getUserCategory(telegramId: number): Promise<number | null> {
  const result = await pool.query<{ deposit_category: number | null }>(
    'SELECT deposit_category FROM users WHERE telegram_id = $1',
    [telegramId],
  );
  if (result.rows.length === 0) return null;
  return result.rows[0]!.deposit_category;
}
