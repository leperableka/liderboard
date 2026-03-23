import { createHmac } from 'node:crypto';

/**
 * Generates a signed web URL that allows a user to access the app
 * outside of Telegram's WebApp context (e.g. when MTProto proxy blocks WebView).
 *
 * Token format: ?tg_id=<telegramId>&ts=<unix_seconds>&sig=<HMAC-SHA256>
 * Valid for 24 hours.
 */
export function generateWebUrl(telegramId: string, botToken: string, baseUrl: string): string {
  const ts = Math.floor(Date.now() / 1000).toString();
  const sig = createHmac('sha256', botToken)
    .update(`web:${telegramId}:${ts}`)
    .digest('hex');
  return `${baseUrl}?tg_id=${telegramId}&ts=${ts}&sig=${sig}`;
}

/**
 * Verifies a web token string (format: "tg_id=X&ts=Y&sig=Z").
 * Returns the telegram_id as a number on success, or null on failure.
 * Rejects tokens older than 24 hours.
 */
export function verifyWebToken(tokenStr: string, botToken: string): number | null {
  const params = new URLSearchParams(tokenStr);
  const tgId = params.get('tg_id');
  const ts = params.get('ts');
  const sig = params.get('sig');
  if (!tgId || !ts || !sig) return null;

  const tsNum = parseInt(ts, 10);
  if (isNaN(tsNum) || Math.floor(Date.now() / 1000) - tsNum > 86400) return null;

  const expected = createHmac('sha256', botToken)
    .update(`web:${tgId}:${ts}`)
    .digest('hex');
  if (expected !== sig) return null;

  const id = parseInt(tgId, 10);
  if (isNaN(id)) return null;

  return id;
}
