/**
 * USD/RUB exchange rate service.
 * Fetches from CBR RF API, caches in Redis for 24 hours.
 * Falls back to the last known cached value on fetch errors.
 */

import { cacheGet, cacheSet } from './cache.js';

const CACHE_KEY = 'exchange:usd_rub';
const CACHE_TTL = 24 * 60 * 60; // 24 hours
const CBR_URL = 'https://www.cbr-xml-daily.ru/daily_json.js';

/** Fallback rate used when API is unavailable and no cached value exists. */
const FALLBACK_RATE = 90;

export async function fetchUsdRubFromCBR(): Promise<number> {
  const res = await fetch(CBR_URL, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`CBR API returned ${res.status}`);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = (await res.json()) as any;
  const usd = json?.Valute?.USD;
  if (!usd || typeof usd.Value !== 'number' || typeof usd.Nominal !== 'number') {
    throw new Error('Unexpected CBR API response shape');
  }
  return usd.Value / usd.Nominal;
}

/**
 * Returns the current USD/RUB rate.
 * Order:
 *   1. Redis cache (valid for 24h)
 *   2. Live CBR API → store in cache
 *   3. Stale cached value (if exists, regardless of TTL)
 *   4. Hard-coded fallback (90 ₽)
 */
export async function getUsdRubRate(): Promise<number> {
  // 1. Try fresh cache
  try {
    const cached = await cacheGet(CACHE_KEY);
    if (cached) {
      return parseFloat(cached);
    }
  } catch {
    // Redis unavailable – fall through
  }

  // 2. Fetch live
  try {
    const rate = await fetchUsdRubFromCBR();
    try {
      await cacheSet(CACHE_KEY, rate.toFixed(4), CACHE_TTL);
    } catch {
      // ignore cache write error
    }
    return rate;
  } catch (err) {
    console.error('exchangeRate: CBR fetch failed:', err);
  }

  // 3. Stale cache (no TTL check)
  try {
    const stale = await cacheGet(CACHE_KEY);
    if (stale) {
      return parseFloat(stale);
    }
  } catch {
    // ignore
  }

  // 4. Hard-coded fallback
  console.warn(`exchangeRate: using fallback rate ${FALLBACK_RATE}`);
  return FALLBACK_RATE;
}

/**
 * Computes initial_deposit_rub: converts deposit to RUB using current USD/RUB rate.
 * MOEX accounts are already in RUB; FOREX and CRYPTO are treated as USD/USDT.
 */
export async function toRub(amount: number, currency: string): Promise<number> {
  if (currency === 'RUB') return amount;
  const rate = await getUsdRubRate();
  return amount * rate;
}

/**
 * Determines deposit category (1, 2, or 3) based on RUB equivalent.
 *   1 → up to 69 999 ₽
 *   2 → 70 000 – 249 999 ₽
 *   3 → 250 000 ₽ and above
 */
export function depositCategory(initialDepositRub: number): 1 | 2 | 3 {
  if (initialDepositRub < 70_000) return 1;
  if (initialDepositRub < 250_000) return 2;
  return 3;
}
