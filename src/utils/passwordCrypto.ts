import crypto from "crypto";
import { env } from "../config/env";

const algorithm = "aes-256-gcm";

function getKey() {
  return crypto.createHash("sha256").update(env.ENCRYPTION_SECRET).digest();
}

export function encryptSecret(secret: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSecret(payload: string) {
  const [ivHex, authTagHex, encryptedHex] = payload.split(":");

  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted password payload");
  }

  const decipher = crypto.createDecipheriv(algorithm, getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final()
  ]).toString("utf8");
}

export const encryptPassword = encryptSecret;
export const decryptPassword = decryptSecret;
