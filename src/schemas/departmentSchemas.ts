import { z } from "zod";

export const departmentIdParamSchema = z.object({
  id: z.string().min(2)
});

export const createDepartmentSchema = z.object({
  id: z.string().min(2),
  name: z.string().min(2),
  iconKey: z.string().min(2).default("outros"),
  description: z.string().min(2)
});

export const updateDepartmentSchema = createDepartmentSchema
  .omit({ id: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided"
  });
