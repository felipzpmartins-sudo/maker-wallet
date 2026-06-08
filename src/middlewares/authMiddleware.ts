import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";
import { verifyToken } from "../utils/jwt";
import { prisma } from "../prisma/client";

export async function authMiddleware(request: Request, _response: Response, next: NextFunction) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError(401, "Missing authentication token");
    }

    const token = authHeader.replace("Bearer ", "");
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        role: true,
        email: true,
        allowedDepartments: true,
        totalAccess: true,
        canManagePermissions: true
      }
    });

    if (!user) {
      throw new AppError(401, "Sessao expirada. Faca login novamente.");
    }

    request.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      allowedDepartments: user.allowedDepartments,
      totalAccess: user.totalAccess,
      canManagePermissions: user.canManagePermissions
    };

    return next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(401, "Invalid authentication token");
  }
}
