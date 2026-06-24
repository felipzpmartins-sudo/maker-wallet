import { Router } from "express";
import { UserRole } from "@prisma/client";
import * as userController from "../controllers/userController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requireRole } from "../middlewares/roleMiddleware";
import { validate } from "../middlewares/validate";
import { idParamSchema } from "../schemas/commonSchemas";
import { createUserSchema, resetUserPasswordSchema, updateUserSchema } from "../schemas/userSchemas";

export const userRoutes = Router();

userRoutes.use(authMiddleware, requireRole(UserRole.ADMIN));

userRoutes.post("/", validate({ body: createUserSchema }), userController.create);
userRoutes.get("/", userController.list);
userRoutes.get("/:id", validate({ params: idParamSchema }), userController.get);
userRoutes.patch(
  "/:id",
  validate({ params: idParamSchema, body: updateUserSchema }),
  userController.update
);
userRoutes.post("/:id/reset-mfa", validate({ params: idParamSchema }), userController.resetMfa);
userRoutes.post(
  "/:id/reset-password",
  validate({ params: idParamSchema, body: resetUserPasswordSchema }),
  userController.resetPassword
);
userRoutes.delete("/:id", validate({ params: idParamSchema }), userController.remove);
