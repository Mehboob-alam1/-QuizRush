import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  CLIENT_URL: z.string().url(),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(10),
  JWT_EXPIRES_IN: z.string().default('7d'),
  SOCKET_CORS_ORIGIN: z.string().url().optional(),
  OTP_DEV_BYPASS: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:', parsed.error.format());
  process.exit(1);
}

export const env = {
  ...parsed.data,
  PORT: Number(parsed.data.PORT),
  SOCKET_CORS_ORIGIN: parsed.data.SOCKET_CORS_ORIGIN ?? parsed.data.CLIENT_URL,
  OTP_DEV_BYPASS: parsed.data.OTP_DEV_BYPASS === 'true',
};

