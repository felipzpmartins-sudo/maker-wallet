import { Request, Response } from "express";
import { success } from "../utils/apiResponse";
import * as mfaService from "../services/mfaService";

export async function setup(request: Request, response: Response) {
  const result = await mfaService.setupMfa(request.user!, request.ip);
  return response.status(201).json(success(result, "MFA setup started"));
}

export async function confirm(request: Request, response: Response) {
  const result = await mfaService.confirmMfa(request.user!, request.body.code, request.ip);
  return response.json(success(result, "MFA enabled"));
}

export async function disable(request: Request, response: Response) {
  const result = await mfaService.disableMfa(request.user!, request.body.code, request.ip);
  return response.json(success(result, "MFA disabled"));
}
