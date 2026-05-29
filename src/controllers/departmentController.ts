import { Request, Response } from "express";
import { success } from "../utils/apiResponse";
import * as departmentService from "../services/departmentService";

export async function list(_request: Request, response: Response) {
  const result = await departmentService.listDepartments();
  return response.json(success(result));
}

export async function create(request: Request, response: Response) {
  const result = await departmentService.createDepartment(request.body);
  return response.status(201).json(success(result, "Department created"));
}

export async function remove(request: Request, response: Response) {
  await departmentService.deleteDepartment(String(request.params.id));
  return response.json(success(null, "Department deleted"));
}
