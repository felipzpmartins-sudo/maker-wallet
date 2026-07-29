import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../prisma/client";
import { AppError } from "../utils/errors";
import { signToken } from "../utils/jwt";
import { sanitizeUser } from "../utils/sanitize";

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new AppError(401, "Invalid credentials");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(401, "Invalid credentials");
  }

  const token = signToken({
    sub: user.id,
    role: user.role,
    email: user.email
  });

  return {
    token,
    user: sanitizeUser(user)
  };
}

export async function register(name: string, email: string, password: string, invite: string) {
  if (invite !== env.REGISTRATION_INVITE_CODE) {
    throw new AppError(403, "Invalid invite code");
  }

  const normalizedEmail = email.toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (existingUser) {
    throw new AppError(409, "Email already in use");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      role: UserRole.RESTRICTED,
      allowedDepartments: [],
      totalAccess: false,
      canManagePermissions: false
    }
  });

  return sanitizeUser(user);
}

export async function changePassword(userId: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      mustChangePassword: false
    }
  });

  await prisma.passwordResetToken.deleteMany({
    where: {
      userId,
      usedAt: null
    }
  });

  return sanitizeUser(user);
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return sanitizeUser(user);
}

export async function updateProfile(
  userId: string,
  data: { name?: string; email?: string; avatarPreset?: string | null }
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      email: data.email?.toLowerCase(),
      avatarPreset: data.avatarPreset,
      ...(data.avatarPreset ? { avatarUrl: null } : {})
    }
  });

  return sanitizeUser(user);
}

export async function updateProfilePhoto(userId: string, avatarUrl: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl, avatarPreset: null }
  });

  return sanitizeUser(user);
}

export async function removeProfilePhoto(userId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: null }
  });

  return sanitizeUser(user);
}
