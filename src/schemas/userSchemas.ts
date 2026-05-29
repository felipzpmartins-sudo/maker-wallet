import { UserRole } from "@prisma/client";
import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(UserRole).default(UserRole.USER)
});

export const updateUserSchema = createUserSchema.partial();
