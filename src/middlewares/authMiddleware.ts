import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";
import { verifyToken } from "../utils/jwt";

export function authMiddleware(request: Request, _response: Response, next: NextFunction) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError(401, "Missing authentication token");
    }

    const token = authHeader.replace("Bearer ", "");
    const payload = verifyToken(token);

    request.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email
    };

    return next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(401, "Invalid authentication token");
  }
}
