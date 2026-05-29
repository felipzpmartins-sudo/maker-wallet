import { Request, Response } from "express";
import { success } from "../utils/apiResponse";
import * as authService from "../services/authService";

export async function login(request: Request, response: Response) {
  const result = await authService.login(request.body.email, request.body.password);
  return response.json(success(result, "Login successful"));
}

export async function register(request: Request, response: Response) {
  const result = await authService.register(
    request.body.name,
    request.body.email,
    request.body.password,
    request.body.invite
  );
  return response.status(201).json(success(result, "Registration created"));
}

export async function me(request: Request, response: Response) {
  const result = await authService.me(request.user!.id);
  return response.json(success(result));
}
