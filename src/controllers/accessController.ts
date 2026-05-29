import { Request, Response } from "express";
import { success } from "../utils/apiResponse";
import * as accessService from "../services/accessService";

export async function create(request: Request, response: Response) {
  const result = await accessService.createAccess(request.body, request.user!, request.ip);
  return response.status(201).json(success(result, "Access item created"));
}

export async function list(request: Request, response: Response) {
  const result = await accessService.listAccess(request.query as never, request.user!);
  return response.json(success(result));
}

export async function get(request: Request, response: Response) {
  const result = await accessService.getAccess(String(request.params.id), request.user!);
  return response.json(success(result));
}

export async function update(request: Request, response: Response) {
  const result = await accessService.updateAccess(
    String(request.params.id),
    request.body,
    request.user!,
    request.ip
  );
  return response.json(success(result, "Access item updated"));
}

export async function remove(request: Request, response: Response) {
  await accessService.deleteAccess(String(request.params.id), request.user!, request.ip);
  return response.status(204).send();
}

export async function revealPassword(request: Request, response: Response) {
  const result = await accessService.revealPassword(
    String(request.params.id),
    request.user!,
    request.body.mfaCode,
    request.ip
  );
  return response.json(success(result, "Password revealed"));
}

export async function copyLog(request: Request, response: Response) {
  await accessService.registerCopyLog(String(request.params.id), request.user!, request.ip);
  return response.status(201).json(success(null, "Copy log registered"));
}

export async function setPermission(request: Request, response: Response) {
  const result = await accessService.setPermission(
    String(request.params.id),
    request.body,
    request.user!,
    request.ip
  );
  return response.json(success(result, "Permission updated"));
}
