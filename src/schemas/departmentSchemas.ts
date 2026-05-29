import { z } from "zod";

export const createDepartmentSchema = z.object({
  id: z.string().min(2),
  name: z.string().min(2),
  iconKey: z.string().min(2).default("outros"),
  description: z.string().min(2)
});
