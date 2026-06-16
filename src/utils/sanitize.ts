import { User } from "@prisma/client";

export function sanitizeUser(user: User) {
  const { passwordHash, mfaSecret, ...safeUser } = user;
  return safeUser;
}

export function sanitizeAccessItem<T extends { encryptedPassword?: string | null }>(accessItem: T) {
  const { encryptedPassword, ...safeAccessItem } = accessItem;
  return safeAccessItem;
}
