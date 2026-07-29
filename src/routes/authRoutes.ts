import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as authController from "../controllers/authController";
import * as mfaController from "../controllers/mfaController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validate";
import {
  changePasswordSchema,
  loginSchema,
  mfaCodeSchema,
  registerSchema,
  updateProfileSchema
} from "../schemas/authSchemas";

export const authRoutes = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false
});

authRoutes.post("/login", loginLimiter, validate({ body: loginSchema }), authController.login);
authRoutes.post("/register", validate({ body: registerSchema }), authController.register);
authRoutes.post(
  "/change-password",
  authMiddleware,
  validate({ body: changePasswordSchema }),
  authController.changePassword
);
authRoutes.get("/me", authMiddleware, authController.me);
authRoutes.patch("/profile", authMiddleware, validate({ body: updateProfileSchema }), authController.updateProfile);
authRoutes.post("/mfa/setup", authMiddleware, mfaController.setup);
authRoutes.post("/mfa/confirm", authMiddleware, validate({ body: mfaCodeSchema }), mfaController.confirm);
authRoutes.post("/mfa/disable", authMiddleware, validate({ body: mfaCodeSchema }), mfaController.disable);
