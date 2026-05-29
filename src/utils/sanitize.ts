import { AccessItem, User } from "@prisma/client";

export function sanitizeUser(user: User) {
  const { passwordHash, mfaSecret, ...safeUser } = user;
  return safeUser;
}

export function sanitizeAccessItem(accessItem: AccessItem) {
  const { encryptedPassword, ...safeAccessItem } = accessItem;
  return safeAccessItem;
}
