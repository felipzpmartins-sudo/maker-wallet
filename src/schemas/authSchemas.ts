import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const mfaCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "MFA code must have 6 digits")
});
