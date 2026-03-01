import type { FastifyInstance } from 'fastify';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import pool from '../db/pool.js';
import { authPreHandler } from '../middleware/auth.js';

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? '/app/uploads';
const MAX_RAW_BYTES = 10 * 1024 * 1024; // 10 MB raw input limit
const AVATAR_SIZE = 400; // max width/height in pixels

export async function avatarRoutes(app: FastifyInstance) {
  /**
   * POST /api/user/:telegramId/avatar
   * Accepts multipart/form-data with a single image file.
   * Compresses to WebP 400×400 quality 85 via sharp, saves to UPLOADS_DIR,
   * updates photo_url in DB, returns { avatarUrl }.
   */
  app.post<{ Params: { telegramId: string } }>(
    '/api/user/:telegramId/avatar',
    { preHandler: [authPreHandler] },
    async (request, reply) => {
      const { telegramId } = request.params;

      // Authorization: only the owner can update their own avatar
      if (request.telegramUser.id !== parseInt(telegramId, 10)) {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      // Consume multipart file (already registered globally in index.ts)
      const data = await request.file({ limits: { fileSize: MAX_RAW_BYTES } });

      if (!data) {
        return reply.status(400).send({ error: 'No file provided' });
      }
      if (!data.mimetype.startsWith('image/')) {
        // Drain stream to avoid memory leak
        data.file.resume();
        return reply.status(400).send({ error: 'Only image files are accepted' });
      }

      const inputBuffer = await data.toBuffer();

      // Compress: resize to max 400×400, encode as WebP quality 85
      const compressed = await sharp(inputBuffer)
        .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

      // Ensure uploads directory exists
      await fs.mkdir(UPLOADS_DIR, { recursive: true });

      const filename = `${telegramId}.webp`;
      await fs.writeFile(path.join(UPLOADS_DIR, filename), compressed);

      const avatarUrl = `/uploads/${filename}`;

      await pool.query(
        'UPDATE users SET photo_url = $1 WHERE telegram_id = $2',
        [avatarUrl, telegramId],
      );

      return reply.send({ avatarUrl });
    },
  );
}
