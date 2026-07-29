import path from "path";
import fs from "fs/promises";
import { Request, Response } from "express";
import { prisma } from "../prisma/client";
import { success } from "../utils/apiResponse";
import { AppError } from "../utils/errors";
import { canAccess } from "../services/permissionService";
import { attachKeystore } from "../services/accessService";
import { createAuditLog } from "../services/auditLogService";
import * as authService from "../services/authService";
import { profilePhotoDirectory } from "../config/paths";

async function removeUploadedFile(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Failed to remove uploaded file ${filePath}`, error);
  }
}

function getProfilePhotoPath(avatarUrl?: string | null) {
  if (!avatarUrl?.startsWith("/uploads/profile-photos/")) return undefined;
  return path.join(profilePhotoDirectory, path.basename(avatarUrl));
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

  const avatarUrl = `/uploads/profile-photos/${request.file.filename}`;
  const currentUser = await authService.me(request.user!.id);
  try {
    const result = await authService.updateProfilePhoto(request.user!.id, avatarUrl);
    const oldPhotoPath = getProfilePhotoPath(currentUser.avatarUrl);
    if (oldPhotoPath) await removeUploadedFile(oldPhotoPath);
    return response.status(201).json(success(result, "Foto de perfil atualizada"));
  } catch (error) {
    await removeUploadedFile(request.file.path);
    throw error;
  }
}

export async function removeProfilePhoto(request: Request, response: Response) {
  const currentUser = await authService.me(request.user!.id);
  const result = await authService.removeProfilePhoto(request.user!.id);
  const photoPath = getProfilePhotoPath(currentUser.avatarUrl);
  if (photoPath) await removeUploadedFile(photoPath);
  return response.json(success(result, "Foto de perfil removida"));
}
