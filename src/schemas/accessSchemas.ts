import { AccessType } from "@prisma/client";
import { z } from "zod";

const optionalString = z.preprocess((value) => {
  if (value === null) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}, z.string().optional());

const optionalPositiveInt = z.preprocess((value) => {
  if (value === null || value === "") return undefined;
  if (typeof value === "number" && !Number.isFinite(value)) return undefined;
  return value;
}, z.number().int().positive().optional());

export const createAccessSchema = z.object({
  type: z.nativeEnum(AccessType),
  title: z.string().min(2),
  description: optionalString,
  host: optionalString,
  port: optionalPositiveInt,
  username: optionalString,
  email: optionalString,
  password: z.string().optional(),
  loginUrl: optionalString,
  observation: optionalString,
  appName: optionalString,
  keystoreFilePath: optionalString,
  credentialId: optionalString,
  credentialSecret: optionalString,
  credentialToken: optionalString,
  departmentIds: z.array(z.string().min(1)).default([])
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
