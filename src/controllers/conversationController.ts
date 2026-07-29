import { Request, Response } from "express";
import { success } from "../utils/apiResponse";
import * as conversationService from "../services/conversationService";

export async function contacts(request: Request, response: Response) {
  return response.json(success(await conversationService.listContacts(request.user!)));
}

export async function list(request: Request, response: Response) {
  return response.json(success(await conversationService.listConversations(request.user!)));
}

export async function createDirect(request: Request, response: Response) {
  const result = await conversationService.createDirectConversation(request.body.participantId, request.user!, request.ip);
  return response.status(201).json(success(result, "Conversa criada"));
}

export async function createSupport(request: Request, response: Response) {
  const result = await conversationService.createSupportConversation(request.user!, request.ip);
  return response.status(201).json(success(result, "Conversa com a administração criada"));
}

export async function createAccessRequest(request: Request, response: Response) {
  const result = await conversationService.createAccessRequest(request.body, request.user!, request.ip);
  return response.status(201).json(success(result, "Solicitação de acesso enviada"));
}

export async function messages(request: Request, response: Response) {
  return response.json(success(await conversationService.listMessages(String(request.params.id), request.user!)));
}

export async function sendMessage(request: Request, response: Response) {
  const result = await conversationService.createMessage(String(request.params.id), request.body.content, request.user!, request.ip);
  return response.status(201).json(success(result, "Mensagem enviada"));
}

export async function updateAccessRequest(request: Request, response: Response) {
  const result = await conversationService.updateAccessRequestStatus(
    String(request.params.id), request.body.status, request.user!, request.ip
  );
  return response.json(success(result, "Status da solicitação atualizado"));
}
