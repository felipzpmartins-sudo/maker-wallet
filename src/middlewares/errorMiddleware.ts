import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
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

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error(error);

    if (error.code === "P2003") {
      return response
        .status(400)
        .json(failure("Registro relacionado nao encontrado. Faca login novamente."));
    }

    return response.status(400).json(failure("Database error", { code: error.code }));
  }

  console.error(error);
  const details =
    error instanceof Error
      ? { name: error.name, message: error.message }
      : { message: String(error) };
  return response.status(500).json(failure("Internal server error", details));
}
