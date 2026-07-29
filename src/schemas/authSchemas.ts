import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  invite: z.string().min(1)
});

export const changePasswordSchema = z.object({
  password: z.string().min(8)
});

export const mfaCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "MFA code must have 6 digits")
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  avatarPreset: z.string().max(64).nullable().optional()
});
