import { UserRole } from "@prisma/client";
import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
  allowedDepartments: z.array(z.string()).default([]),
  totalAccess: z.boolean().default(false),
  canManagePermissions: z.boolean().default(false)
});

export const updateUserSchema = createUserSchema.partial();
