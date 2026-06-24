import { Request, Response } from "express";
import { success } from "../utils/apiResponse";
import * as userService from "../services/userService";

export async function create(request: Request, response: Response) {
  const result = await userService.createUser(request.body);
  return response.status(201).json(success(result, "User created"));
}

export async function list(_request: Request, response: Response) {
  const result = await userService.listUsers();
  return response.json(success(result));
}

export async function get(request: Request, response: Response) {
  const result = await userService.getUser(String(request.params.id));
  return response.json(success(result));
}

export async function update(request: Request, response: Response) {
  const result = await userService.updateUser(String(request.params.id), request.body);
  return response.json(success(result, "User updated"));
}

export async function remove(request: Request, response: Response) {
  await userService.deleteUser(String(request.params.id), request.user!, request.ip);
  return response.status(204).send();
}

export async function resetMfa(request: Request, response: Response) {
  const result = await userService.resetUserMfa(String(request.params.id), request.user!, request.ip);
  return response.json(success(result, "User MFA reset"));
}

export async function resetPassword(request: Request, response: Response) {
  const result = await userService.resetUserPassword(
    String(request.params.id),
    request.body.password,
    request.user!,
    request.ip
  );
  return response.json(success(result, "User password reset"));
}
