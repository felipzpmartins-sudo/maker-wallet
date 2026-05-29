import { Request, Response } from "express";
import { success } from "../utils/apiResponse";
import * as renewalService from "../services/renewalService";

export async function create(request: Request, response: Response) {
  const result = await renewalService.createRenewalService(request.body, request.user!, request.ip);
  return response.status(201).json(success(result, "Renewal service created"));
}

export async function list(request: Request, response: Response) {
  const result = await renewalService.listRenewalServices(request.query as never, request.user!);
  return response.json(success(result));
}

export async function get(request: Request, response: Response) {
  const result = await renewalService.getRenewalService(String(request.params.id), request.user!);
  return response.json(success(result));
}

export async function update(request: Request, response: Response) {
  const result = await renewalService.updateRenewalService(
    String(request.params.id),
    request.body,
    request.user!,
    request.ip
  );
  return response.json(success(result, "Renewal service updated"));
}

export async function remove(request: Request, response: Response) {
  await renewalService.deleteRenewalService(String(request.params.id), request.user!, request.ip);
  return response.status(204).send();
}
