import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { failure } from "../utils/apiResponse";
import { AppError } from "../utils/errors";

export function errorMiddleware(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  if (error instanceof AppError) {
    return response.status(error.statusCode).json(failure(error.message, error.details));
  }

  if (error instanceof ZodError) {
    return response.status(400).json(failure("Validation error", error.flatten()));
  }

  console.error(error);
  return response.status(500).json(failure("Internal server error"));
}
