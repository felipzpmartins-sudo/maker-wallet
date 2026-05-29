import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client";
import { AppError } from "../utils/errors";
import { sanitizeUser } from "../utils/sanitize";
import { createAuditLog } from "./auditLogService";

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "USER" | "RESTRICTED";
  allowedDepartments?: string[];
  totalAccess?: boolean;
  canManagePermissions?: boolean;
}) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (existingUser) {
    throw new AppError(409, "Email already in use");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      allowedDepartments: data.allowedDepartments ?? [],
      totalAccess: data.totalAccess ?? false,
      canManagePermissions: data.canManagePermissions ?? false
    }
  });

  return sanitizeUser(user);
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" }
  });

  return users.map(sanitizeUser);
}

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return sanitizeUser(user);
}

export async function updateUser(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    password: string;
    role: "ADMIN" | "USER" | "RESTRICTED";
    allowedDepartments: string[];
    totalAccess: boolean;
    canManagePermissions: boolean;
  }>
) {
  const updateData: Prisma.UserUpdateInput = {
    name: data.name,
    email: data.email,
    role: data.role,
    allowedDepartments: data.allowedDepartments,
    totalAccess: data.totalAccess,
    canManagePermissions: data.canManagePermissions
  };

  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 12);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData
  });

  return sanitizeUser(user);
}

export async function deleteUser(id: string, currentUser: Express.User, ipAddress?: string) {
  if (id === currentUser.id) {
    throw new AppError(400, "You cannot delete your own user");
  }

  await prisma.user.delete({
    where: { id }
  });

  await createAuditLog({
    userId: currentUser.id,
    action: "USER_DELETED",
    ipAddress
  });
}

export async function resetUserMfa(id: string, currentUser: Express.User, ipAddress?: string) {
  if (id === currentUser.id) {
    throw new AppError(400, "You cannot reset your own MFA here");
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      mfaEnabled: false,
      mfaSecret: null
    }
  });

  await createAuditLog({
    userId: currentUser.id,
    action: "USER_MFA_RESET",
    ipAddress
  });

  return sanitizeUser(user);
}
