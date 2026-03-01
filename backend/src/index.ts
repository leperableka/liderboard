import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { Bot } from 'grammy';

import pool from './db/pool.js';
import { createRedisClient } from './services/cache.js';
import { userRoutes } from './routes/user.js';
import { leaderboardRoutes } from './routes/leaderboard.js';
import { depositRoutes } from './routes/deposit.js';
import { avatarRoutes } from './routes/avatar.js';
import { scheduleNotifications } from './jobs/notifications.js';

// ─── Environment validation ──────────────────────────────────────────────────

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable "${name}" is not set`);
  }
  return value;
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  const port = parseInt(process.env['PORT'] ?? '3000', 10);
  const host = process.env['HOST'] ?? '0.0.0.0';
  const nodeEnv = process.env['NODE_ENV'] ?? 'production';
  const isDev = nodeEnv === 'development';

  // ── Fastify instance ──────────────────────────────────────────────────────
  const fastify = Fastify({
    trustProxy: true,
    logger: {
      level: isDev ? 'debug' : 'info',
      ...(isDev
        ? {
            transport: {
              target: 'pino-pretty',
              options: { colorize: true },
            },
          }
        : {}),
    },
  });

  // ── CORS ──────────────────────────────────────────────────────────────────
  const corsOrigin = process.env['CORS_ORIGIN'] ?? false;
  await fastify.register(cors, {
    origin: corsOrigin || false,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Telegram-InitData'],
  });

  // ── Rate limiting (60 req / min per IP) ───────────────────────────────────
  await fastify.register(rateLimit, {
    max: 60,
    timeWindow: '1 minute',
    errorResponseBuilder: (_request, context) => ({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
      statusCode: 429,
    }),
  });

  // ── Multipart (file uploads) ───────────────────────────────────────────────
  await fastify.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB
    },
  });

  // ── Health check ──────────────────────────────────────────────────────────
  fastify.get('/health', async (_request, reply) => {
    try {
      await pool.query('SELECT 1');
      return reply.code(200).send({ status: 'ok' });
    } catch {
      return reply.code(503).send({ status: 'degraded', db: 'unreachable' });
    }
  });

  // ── Grammy bot (init before routes so register handler can send welcome) ──
  let cronTask: { stop: () => void } | null = null;
  let bot: Bot | undefined;

  if (!isDev) {
    const botToken = requireEnv('BOT_TOKEN');
    const miniAppUrl = requireEnv('MINI_APP_URL');

    bot = new Bot(botToken);

    // Inline keyboard button with primary (blue) style — Bot API 9.4+
    const appButton = {
      text: '🏆 Открыть приложение',
      web_app: { url: miniAppUrl },
      style: 'primary',
    };

    // Basic /start handler
    bot.command('start', async (ctx) => {
      await ctx.reply(
        'Добро пожаловать в Торговый Турнир! Откройте приложение, чтобы участвовать.',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { reply_markup: { inline_keyboard: [[appButton as any]] } },
      );
    });

    // Fallback: any unknown command or message
    bot.on('message', async (ctx) => {
      await ctx.reply(
        'Используйте кнопку ниже, чтобы открыть Торговый Турнир.',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { reply_markup: { inline_keyboard: [[appButton as any]] } },
      );
    });

    // Start polling (non-blocking)
    bot.start({
      onStart: () => {
        fastify.log.info('Grammy bot started (long polling)');
      },
    }).catch((err) => {
      fastify.log.error({ err }, 'Grammy bot error');
    });

    cronTask = scheduleNotifications(bot, miniAppUrl);
  } else {
    fastify.log.info('Development mode: Grammy bot and cron disabled');
  }

  // ── Routes ────────────────────────────────────────────────────────────────
  await fastify.register(userRoutes, { bot, miniAppUrl: process.env['MINI_APP_URL'] ?? '' });
  await fastify.register(leaderboardRoutes);
  await fastify.register(depositRoutes);
  await fastify.register(avatarRoutes);

  // ── Redis ─────────────────────────────────────────────────────────────────
  const redisUrl = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
  const redis = createRedisClient(redisUrl);

  // ── Start server ──────────────────────────────────────────────────────────
  await fastify.listen({ port, host });
  fastify.log.info(`Server running at http://${host}:${port} [${nodeEnv}]`);

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    fastify.log.info(`Received ${signal}, shutting down gracefully...`);

    cronTask?.stop();

    try {
      await fastify.close();
      fastify.log.info('HTTP server closed');
    } catch (err) {
      fastify.log.error({ err }, 'Error closing HTTP server');
    }

    try {
      await pool.end();
      fastify.log.info('PostgreSQL pool closed');
    } catch (err) {
      fastify.log.error({ err }, 'Error closing PostgreSQL pool');
    }

    try {
      await redis.quit();
      fastify.log.info('Redis connection closed');
    } catch (err) {
      fastify.log.error({ err }, 'Error closing Redis connection');
    }

    process.exit(0);
  };

  process.on('SIGTERM', () => { shutdown('SIGTERM').catch(console.error); });
  process.on('SIGINT',  () => { shutdown('SIGINT').catch(console.error); });
}

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
