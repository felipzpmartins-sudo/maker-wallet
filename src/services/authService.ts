import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { UserRole } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../prisma/client";
import { sendPasswordResetEmail } from "./emailService";
import { AppError } from "../utils/errors";
import { signToken } from "../utils/jwt";
import { sanitizeUser } from "../utils/sanitize";

const PASSWORD_RESET_EXPIRATION_MS = 60 * 60 * 1000;

function hashResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

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

export async function requestPasswordReset(email: string) {
  const normalizedEmail = email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user) {
    return { emailSent: false };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRATION_MS);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt
    }
  });

  const resetUrl = `${env.FRONTEND_URL.replace(/\/$/, "")}/reset-password?token=${token}`;
  await sendPasswordResetEmail(user.email, user.name, resetUrl);

  return { emailSent: true };
}

export async function resetPassword(token: string, password: string) {
  const tokenHash = hashResetToken(token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash }
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw new AppError(400, "Token de redefinicao invalido ou expirado");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash }
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() }
    }),
    prisma.passwordResetToken.deleteMany({
      where: {
        userId: resetToken.userId,
        usedAt: null,
        id: { not: resetToken.id }
      }
    })
  ]);

  return { passwordReset: true };
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
