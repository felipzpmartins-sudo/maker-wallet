import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validate";
import { idParamSchema } from "../schemas/commonSchemas";
import {
  createAccessRequestSchema,
  createDirectConversationSchema,
  createMessageSchema,
  createSupportConversationSchema,
  updateAccessRequestSchema
} from "../schemas/conversationSchemas";
import * as conversationController from "../controllers/conversationController";

export const conversationRoutes = Router();

conversationRoutes.use(authMiddleware);
conversationRoutes.get("/contacts", conversationController.contacts);
conversationRoutes.get("/", conversationController.list);
conversationRoutes.post("/direct", validate({ body: createDirectConversationSchema }), conversationController.createDirect);
conversationRoutes.post("/support", validate({ body: createSupportConversationSchema }), conversationController.createSupport);
conversationRoutes.post("/access-requests", validate({ body: createAccessRequestSchema }), conversationController.createAccessRequest);
conversationRoutes.get("/:id/messages", validate({ params: idParamSchema }), conversationController.messages);
conversationRoutes.post("/:id/messages", validate({ params: idParamSchema, body: createMessageSchema }), conversationController.sendMessage);
conversationRoutes.patch("/:id/access-request", validate({ params: idParamSchema, body: updateAccessRequestSchema }), conversationController.updateAccessRequest);
