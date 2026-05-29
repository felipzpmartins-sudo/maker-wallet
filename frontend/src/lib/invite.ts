const fallbackInviteCode = "maker-wallet-convite";
const productionAppUrl = "https://wallet.makergrupo.com.br";

export const registrationInviteCode =
  import.meta.env.VITE_REGISTRATION_INVITE_CODE || fallbackInviteCode;

export function isValidRegistrationInvite(invite?: string) {
  return invite === registrationInviteCode;
}

export function buildRegistrationInviteUrl(origin: string) {
  const parsedOrigin = new URL(origin);
  const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(parsedOrigin.hostname);
  const appOrigin = isLocalhost ? productionAppUrl : parsedOrigin.origin;
  const url = new URL("/register", appOrigin);
  url.searchParams.set("invite", registrationInviteCode);
  return url.toString();
}
