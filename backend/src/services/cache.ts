import { Redis } from 'ioredis';

let redisClient: Redis | null = null;

export function createRedisClient(url: string): Redis {
  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  client.on('error', (err: Error) => {
    console.error('Redis client error:', err);
  });

  client.on('connect', () => {
    console.log('Redis connected');
  });

  redisClient = client;
  return client;
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call createRedisClient first.');
  }
  return redisClient;
}

export async function cacheGet(key: string): Promise<string | null> {
  const client = getRedisClient();
  return client.get(key);
}

export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds: number,
): Promise<void> {
  const client = getRedisClient();
  await client.set(key, value, 'EX', ttlSeconds);
}

export async function cacheDel(key: string): Promise<void> {
  const client = getRedisClient();
  await client.del(key);
}

/**
 * Deletes all keys matching a glob pattern (e.g. "leaderboard:*").
 * Uses SCAN to avoid blocking the Redis event loop.
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
  const client = getRedisClient();
  let cursor = '0';
  do {
    const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = nextCursor;
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } while (cursor !== '0');
}

