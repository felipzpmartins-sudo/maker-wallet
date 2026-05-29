const fallbackInviteCode = "maker-wallet-convite";

export const registrationInviteCode =
  import.meta.env.VITE_REGISTRATION_INVITE_CODE || fallbackInviteCode;

export function isValidRegistrationInvite(invite?: string) {
  return invite === registrationInviteCode;
}

export function buildRegistrationInviteUrl(origin: string) {
  const url = new URL("/register", origin);
  url.searchParams.set("invite", registrationInviteCode);
  return url.toString();
}
