import { createHmac } from 'node:crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { TelegramUser } from '../types.js';

// Extend FastifyRequest to carry the verified Telegram user
declare module 'fastify' {
  interface FastifyRequest {
    telegramUser: TelegramUser;
  }
}

/**
 * Verifies Telegram WebApp initData using HMAC-SHA256.
 *
 * Algorithm (from Telegram docs):
 *  1. Parse initData query string into key=value pairs.
 *  2. Remove the "hash" field, sort remaining pairs alphabetically, join with \n.
 *  3. Compute HMAC-SHA256 of the resulting string using a secret key derived as
 *     HMAC-SHA256("WebAppData", BOT_TOKEN).
 *  4. Compare the computed hash with the "hash" field from initData.
 */
function verifyTelegramInitData(initData: string, botToken: string): TelegramUser | null {
  const params = new URLSearchParams(initData);
  const receivedHash = params.get('hash');
  if (!receivedHash) return null;

  // Build the data-check string: sorted key=value pairs (excluding hash), joined by \n
  const entries: string[] = [];
  params.forEach((value, key) => {
    if (key !== 'hash') {
      entries.push(`${key}=${value}`);
    }
  });
  entries.sort();
  const dataCheckString = entries.join('\n');

  // Derive the secret key
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();

  // Compute expected hash
  const expectedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (expectedHash !== receivedHash) return null;

  // Parse the user field
  const userRaw = params.get('user');
  if (!userRaw) return null;

  let userJson: Record<string, unknown>;
  try {
    userJson = JSON.parse(userRaw) as Record<string, unknown>;
  } catch {
    return null;
  }

  if (typeof userJson['id'] !== 'number' || typeof userJson['first_name'] !== 'string') {
    return null;
  }

  return {
    id: userJson['id'] as number,
    username:
      typeof userJson['username'] === 'string' ? userJson['username'] : undefined,
    first_name: userJson['first_name'] as string,
    last_name:
      typeof userJson['last_name'] === 'string' ? userJson['last_name'] : undefined,
    photo_url:
      typeof userJson['photo_url'] === 'string' ? userJson['photo_url'] : undefined,
  };
}

const MOCK_TELEGRAM_USER: TelegramUser = {
  id: 123456789,
  username: 'dev_trader',
  first_name: 'Dev',
  last_name: 'User',
  photo_url: undefined,
};

export async function authPreHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const isDev = process.env['NODE_ENV'] === 'development';

  if (isDev) {
    request.telegramUser = MOCK_TELEGRAM_USER;
    return;
  }

  const initData = request.headers['x-telegram-initdata'];
  if (!initData || typeof initData !== 'string') {
    await reply.code(401).send({ error: 'Missing X-Telegram-InitData header' });
    return;
  }

  const botToken = process.env['BOT_TOKEN'];
  if (!botToken) {
    request.log.error('BOT_TOKEN environment variable is not set');
    await reply.code(500).send({ error: 'Server configuration error' });
    return;
  }

  const telegramUser = verifyTelegramInitData(initData, botToken);
  if (!telegramUser) {
    await reply.code(401).send({ error: 'Invalid or expired Telegram initData' });
    return;
  }

  request.telegramUser = telegramUser;
}
