import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory or root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const configSchema = z.object({
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DB_PATH: z.string().default(path.resolve(__dirname, '../../../data/mahalaxmi.db')),
  CORS_ORIGIN: z.string().default('*'),
  SHOP_NAME: z.string().default('Mahalaxmi General Stores'),
  SHOP_LOCATION: z.string().default('Honnavar, Karnataka, India'),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid server configuration:', parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;
