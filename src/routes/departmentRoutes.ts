import { Router } from "express";
import { UserRole } from "@prisma/client";
import * as departmentController from "../controllers/departmentController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requireRole } from "../middlewares/roleMiddleware";
import { validate } from "../middlewares/validate";
import { idParamSchema } from "../schemas/commonSchemas";
import { createDepartmentSchema } from "../schemas/departmentSchemas";

export const departmentRoutes = Router();

departmentRoutes.use(authMiddleware);

departmentRoutes.get("/", departmentController.list);
departmentRoutes.post(
  "/",
  requireRole(UserRole.ADMIN),
  validate({ body: createDepartmentSchema }),
  departmentController.create
);
departmentRoutes.delete(
  "/:id",
  requireRole(UserRole.ADMIN),
  validate({ params: idParamSchema }),
  departmentController.remove
);
