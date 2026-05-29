import { Router } from "express";
import * as accessController from "../controllers/accessController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validate";
import {
  accessQuerySchema,
  createAccessSchema,
  permissionSchema,
  revealPasswordSchema,
  updateAccessSchema
} from "../schemas/accessSchemas";
import { idParamSchema } from "../schemas/commonSchemas";

export const accessRoutes = Router();

accessRoutes.use(authMiddleware);

accessRoutes.post("/", validate({ body: createAccessSchema }), accessController.create);
accessRoutes.get("/", validate({ query: accessQuerySchema }), accessController.list);
accessRoutes.get("/:id", validate({ params: idParamSchema }), accessController.get);
accessRoutes.patch(
  "/:id",
  validate({ params: idParamSchema, body: updateAccessSchema }),
  accessController.update
);
accessRoutes.delete("/:id", validate({ params: idParamSchema }), accessController.remove);
accessRoutes.post(
  "/:id/reveal-password",
  validate({ params: idParamSchema, body: revealPasswordSchema }),
  accessController.revealPassword
);
accessRoutes.post("/:id/copy-log", validate({ params: idParamSchema }), accessController.copyLog);
accessRoutes.post(
  "/:id/permissions",
  validate({ params: idParamSchema, body: permissionSchema }),
  accessController.setPermission
);
