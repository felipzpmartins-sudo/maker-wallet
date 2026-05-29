import { RenewalInterval, RenewalServiceType } from "@prisma/client";
import { z } from "zod";

export const createRenewalServiceSchema = z.object({
  name: z.string().min(2),
  type: z.nativeEnum(RenewalServiceType),
  provider: z.string().optional(),
  description: z.string().optional(),
  renewalUrl: z.string().url().optional(),
  amount: z.number().nonnegative().optional(),
  currency: z.string().min(3).max(3).default("BRL"),
  renewalInterval: z.nativeEnum(RenewalInterval).default(RenewalInterval.YEARLY),
  expiresAt: z.coerce.date(),
  notifyDaysBefore: z.number().int().positive().max(365).default(30),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
  accessItemId: z.string().uuid().optional()
});

export const updateRenewalServiceSchema = createRenewalServiceSchema.partial();

export const renewalServiceQuerySchema = z.object({
  type: z.nativeEnum(RenewalServiceType).optional(),
  status: z.enum(["active", "expiring", "expired", "inactive"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});
