import { Router } from "express";
import * as uploadController from "../controllers/uploadController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { keystoreUpload } from "../middlewares/uploadMiddleware";
import { validate } from "../middlewares/validate";
import { idParamSchema } from "../schemas/commonSchemas";

export const uploadRoutes = Router();

uploadRoutes.use(authMiddleware);

uploadRoutes.post("/keystore", keystoreUpload.single("file"), uploadController.uploadKeystore);
uploadRoutes.get(
  "/keystore/:id/download",
  validate({ params: idParamSchema }),
  uploadController.downloadKeystore
);
