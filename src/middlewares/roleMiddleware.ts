import { NextFunction, Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { AppError } from "../utils/errors";

export function requireRole(...roles: UserRole[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user || !roles.includes(request.user.role)) {
      throw new AppError(403, "Insufficient role");
    }

    return next();
  };
}
