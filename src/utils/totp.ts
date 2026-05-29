import crypto from "crypto";

const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateTotpSecret(length = 20) {
  const bytes = crypto.randomBytes(length);
  let bits = "";
  let secret = "";

  for (const byte of bytes) {
    bits += byte.toString(2).padStart(8, "0");
  }

  for (let i = 0; i + 5 <= bits.length; i += 5) {
    secret += base32Alphabet[parseInt(bits.slice(i, i + 5), 2)];
  }

  return secret;
}

function decodeBase32(secret: string) {
  const cleanSecret = secret.replace(/=+$/g, "").replace(/\s+/g, "").toUpperCase();
  let bits = "";

  for (const char of cleanSecret) {
    const value = base32Alphabet.indexOf(char);
    if (value === -1) {
      throw new Error("Invalid TOTP secret");
    }
    bits += value.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }

  return Buffer.from(bytes);
}

function generateCode(secret: string, timeStep: number) {
  const key = decodeBase32(secret);
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(timeStep));

  const hmac = crypto.createHmac("sha1", key).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    (((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)) %
    1_000_000;

  return code.toString().padStart(6, "0");
}

export function verifyTotpCode(secret: string, code: string, window = 1) {
  const cleanCode = code.replace(/\s+/g, "");

  if (!/^\d{6}$/.test(cleanCode)) {
    return false;
  }

  const currentStep = Math.floor(Date.now() / 30_000);

  for (let offset = -window; offset <= window; offset += 1) {
    const expectedCode = generateCode(secret, currentStep + offset);
    const expected = Buffer.from(expectedCode);
    const provided = Buffer.from(cleanCode);

    if (expected.length === provided.length && crypto.timingSafeEqual(expected, provided)) {
      return true;
    }
  }

  return false;
}

export function buildTotpUri(secret: string, accountName: string, issuer = "Maker Wallet") {
  const label = `${issuer}:${accountName}`;
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30"
  });

  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
}
