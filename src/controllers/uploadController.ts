import path from "path";
import fs from "fs/promises";
import { Request, Response } from "express";
import { prisma } from "../prisma/client";
import { success } from "../utils/apiResponse";
import { AppError } from "../utils/errors";
import { canAccess } from "../services/permissionService";
import { attachKeystore } from "../services/accessService";
import { createAuditLog } from "../services/auditLogService";

async function removeUploadedFile(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Failed to remove uploaded file ${filePath}`, error);
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
