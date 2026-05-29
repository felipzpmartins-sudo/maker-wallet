import bcrypt from "bcryptjs";
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

export async function me(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return sanitizeUser(user);
}
