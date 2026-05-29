import { prisma } from "../prisma/client";
import { AppError } from "../utils/errors";
import { decryptSecret, encryptSecret } from "../utils/passwordCrypto";
import { buildTotpUri, generateTotpSecret, verifyTotpCode } from "../utils/totp";
import { createAuditLog } from "./auditLogService";

export async function setupMfa(user: Express.User, ipAddress?: string) {
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id }
  });

  if (!dbUser) {
    throw new AppError(404, "User not found");
  }

  const secret = generateTotpSecret();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      mfaSecret: encryptSecret(secret),
      mfaEnabled: false
    }
  });

  await createAuditLog({
    userId: user.id,
    action: "MFA_SETUP_STARTED",
    ipAddress
  });

  return {
    secret,
    otpauthUrl: buildTotpUri(secret, dbUser.email)
  };
}

export async function confirmMfa(user: Express.User, code: string, ipAddress?: string) {
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id }
  });

  if (!dbUser?.mfaSecret) {
    throw new AppError(400, "MFA setup has not been started");
  }

  const secret = decryptSecret(dbUser.mfaSecret);

  if (!verifyTotpCode(secret, code)) {
    await createAuditLog({
      userId: user.id,
      action: "MFA_CONFIRM_FAILED",
      ipAddress
    });
    throw new AppError(401, "Invalid MFA code");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      mfaEnabled: true
    }
  });

  await createAuditLog({
    userId: user.id,
    action: "MFA_ENABLED",
    ipAddress
  });

  return {
    mfaEnabled: true
  };
}

export async function disableMfa(user: Express.User, code: string, ipAddress?: string) {
  await verifyMfaOrThrow(user.id, code, ipAddress, "MFA_DISABLE_FAILED");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      mfaEnabled: false,
      mfaSecret: null
    }
  });

  await createAuditLog({
    userId: user.id,
    action: "MFA_DISABLED",
    ipAddress
  });

  return {
    mfaEnabled: false
  };
}

export async function verifyMfaOrThrow(
  userId: string,
  code: string | undefined,
  ipAddress?: string,
  failureAction = "MFA_CHALLENGE_FAILED"
) {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!dbUser) {
    throw new AppError(404, "User not found");
  }

  if (!dbUser.mfaEnabled || !dbUser.mfaSecret) {
    throw new AppError(403, "MFA is required to reveal passwords");
  }

  if (!code || !verifyTotpCode(decryptSecret(dbUser.mfaSecret), code)) {
    await createAuditLog({
      userId,
      action: failureAction,
      ipAddress
    });
    throw new AppError(401, "Invalid MFA code");
  }
}
