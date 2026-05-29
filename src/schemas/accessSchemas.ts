import { AccessType } from "@prisma/client";
import { z } from "zod";

export const createAccessSchema = z.object({
  type: z.nativeEnum(AccessType),
  title: z.string().min(2),
  description: z.string().optional(),
  host: z.string().optional(),
  port: z.number().int().positive().optional(),
  username: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().optional(),
  loginUrl: z.string().url().optional(),
  observation: z.string().optional(),
  appName: z.string().optional(),
  keystoreFilePath: z.string().optional()
});

export const updateAccessSchema = createAccessSchema.partial();

export const accessQuerySchema = z.object({
  type: z.nativeEnum(AccessType).optional(),
  search: z.string().optional(),
  userId: z.string().uuid().optional(),
  createdBy: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const permissionSchema = z.object({
  userId: z.string().uuid(),
  canView: z.boolean().default(false),
  canEdit: z.boolean().default(false),
  canDelete: z.boolean().default(false)
});

export const revealPasswordSchema = z.object({
  mfaCode: z.string().regex(/^\d{6}$/, "MFA code must have 6 digits")
});
