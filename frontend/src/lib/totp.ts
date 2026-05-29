const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateMockTotpSecret(length = 32) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export function buildTotpUrl(secret: string, email: string, issuer = "Maker Wallet") {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });

  return `otpauth://totp/${encodeURIComponent(`${issuer}:${email}`)}?${params.toString()}`;
}

function decodeBase32(secret: string) {
  const cleanSecret = secret.replace(/=+$/g, "").replace(/\s+/g, "").toUpperCase();
  let bits = "";

  for (const char of cleanSecret) {
    const value = alphabet.indexOf(char);
    if (value === -1) throw new Error("Invalid TOTP secret");
    bits += value.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }

  return new Uint8Array(bytes);
}

async function generateTotpCode(secret: string, timeStep: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    decodeBase32(secret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const counter = new ArrayBuffer(8);
  const view = new DataView(counter);
  view.setUint32(4, timeStep, false);

  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, counter));
  const offset = signature[signature.length - 1] & 0x0f;
  const binary =
    ((signature[offset] & 0x7f) << 24) |
    ((signature[offset + 1] & 0xff) << 16) |
    ((signature[offset + 2] & 0xff) << 8) |
    (signature[offset + 3] & 0xff);

  return (binary % 1_000_000).toString().padStart(6, "0");
}

export async function verifyTotpCode(secret: string | undefined, code: string, window = 1) {
  const cleanCode = code.replace(/\s+/g, "");

  if (!secret || !/^\d{6}$/.test(cleanCode)) return false;

  const currentStep = Math.floor(Date.now() / 30_000);

  for (let offset = -window; offset <= window; offset += 1) {
    const expected = await generateTotpCode(secret, currentStep + offset);
    if (expected === cleanCode) return true;
  }

  return false;
}
