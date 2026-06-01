import { Router } from "express";
import { authRoutes } from "./authRoutes";
import { userRoutes } from "./userRoutes";
import { accessRoutes } from "./accessRoutes";
import { uploadRoutes } from "./uploadRoutes";
import { renewalServiceRoutes } from "./renewalServiceRoutes";
import { departmentRoutes } from "./departmentRoutes";
import { env } from "../config/env";

export const routes = Router();

routes.get("/", (_request, response) => {
  return response.redirect(env.FRONTEND_URL);
});

routes.get("/health", (_request, response) => {
  return response.json({
    success: true,
    message: "Maker Wallet API is running"
  });
});

routes.use("/auth", authRoutes);
routes.use("/users", userRoutes);
routes.use("/departments", departmentRoutes);
routes.use("/access", accessRoutes);
routes.use("/renewal-services", renewalServiceRoutes);
routes.use("/upload", uploadRoutes);
