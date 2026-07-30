import path from "path";
import fs from "fs/promises";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../prisma/client";
import { success } from "../utils/apiResponse";
import { AppError } from "../utils/errors";
import { canAccess } from "../services/permissionService";
import { attachKeystore } from "../services/accessService";
import { createAuditLog } from "../services/auditLogService";
import * as authService from "../services/authService";

async function removeUploadedFile(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Failed to remove uploaded file ${filePath}`, error);
  }
}

function profilePhotoMimeType(filename: string) {
  switch (path.extname(filename).toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    default:
      throw new AppError(400, "Formato de foto inválido. Envie JPG, PNG ou WEBP.");
  }
}

export async function uploadKeystore(request: Request, response: Response) {
  if (!request.file) {
    throw new AppError(400, "Keystore file is required");
  }

  const accessItemId = request.body.accessItemId;

  if (!accessItemId) {
    await removeUploadedFile(request.file.path);
    throw new AppError(400, "accessItemId is required");
  }

  try {
    const result = await attachKeystore(accessItemId, request.file.path, request.user!, request.ip);
    return response.status(201).json(success(result, "Keystore uploaded"));
  } catch (error) {
    await removeUploadedFile(request.file.path);
    throw error;
  }
}

export async function downloadKeystore(request: Request, response: Response) {
  const accessItem = await prisma.accessItem.findUnique({
    where: { id: String(request.params.id) }
  });

  if (!accessItem?.keystoreFilePath) {
    throw new AppError(404, "Keystore not found");
  }

  const allowed = await canAccess(request.user!, accessItem.id, "view");

  if (!allowed) {
    throw new AppError(403, "Access denied");
  }

  await createAuditLog({
    userId: request.user!.id,
    action: "KEYSTORE_DOWNLOADED",
    accessItemId: accessItem.id,
    ipAddress: request.ip
  });

  return response.download(
    accessItem.keystoreFilePath,
    path.basename(accessItem.keystoreFilePath)
  );
}

export async function uploadProfilePhoto(request: Request, response: Response) {
  if (!request.file) {
    throw new AppError(400, "Foto de perfil é obrigatória");
  }

  const userId = request.user!.id;
  const content = Uint8Array.from(request.file.buffer);
  const mimeType = profilePhotoMimeType(request.file.originalname);
  const photo = await prisma.profilePhoto.upsert({
    where: { userId },
    create: {
      userId,
      content,
      mimeType
    },
    update: {
      content,
      mimeType
    }
  });
  const avatarUrl = `/uploads/profile-photos/${userId}?v=${photo.updatedAt.getTime()}`;
  const result = await authService.updateProfilePhoto(userId, avatarUrl);
  return response.status(201).json(success(result, "Foto de perfil atualizada"));
}

export async function removeProfilePhoto(request: Request, response: Response) {
  const userId = request.user!.id;
  await prisma.profilePhoto.deleteMany({ where: { userId } });
  const result = await authService.removeProfilePhoto(userId);
  return response.json(success(result, "Foto de perfil removida"));
}

export async function getProfilePhoto(request: Request, response: Response, next: NextFunction) {
  const photo = await prisma.profilePhoto.findUnique({
    where: { userId: String(request.params.userId) }
  });

  // Mantém acessíveis as fotos antigas que ainda estejam no diretório de uploads
  // durante a transição para o armazenamento persistente.
  if (!photo) return next();

  response.set({
    "Cache-Control": "public, max-age=31536000, immutable",
    "Cross-Origin-Resource-Policy": "cross-origin"
  });
  return response.type(photo.mimeType).send(photo.content);
}
