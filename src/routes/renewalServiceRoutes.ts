import { Router } from "express";
import * as renewalServiceController from "../controllers/renewalServiceController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validate";
import {
  createRenewalServiceSchema,
  renewalServiceQuerySchema,
  updateRenewalServiceSchema
} from "../schemas/renewalServiceSchemas";
import { idParamSchema } from "../schemas/commonSchemas";

export const renewalServiceRoutes = Router();

renewalServiceRoutes.use(authMiddleware);

renewalServiceRoutes.post("/", validate({ body: createRenewalServiceSchema }), renewalServiceController.create);
renewalServiceRoutes.get("/", validate({ query: renewalServiceQuerySchema }), renewalServiceController.list);
renewalServiceRoutes.get("/:id", validate({ params: idParamSchema }), renewalServiceController.get);
renewalServiceRoutes.patch(
  "/:id",
  validate({ params: idParamSchema, body: updateRenewalServiceSchema }),
  renewalServiceController.update
);
renewalServiceRoutes.delete("/:id", validate({ params: idParamSchema }), renewalServiceController.remove);
