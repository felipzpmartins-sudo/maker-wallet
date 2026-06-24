import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  ENCRYPTION_SECRET: z.string().min(16),
  PORT: z.coerce.number().default(3333),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  REGISTRATION_INVITE_CODE: z.string().min(1).default("maker-wallet-convite")
});

export const env = envSchema.parse(process.env);
