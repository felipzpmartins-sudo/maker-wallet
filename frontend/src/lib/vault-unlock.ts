const storageKey = "maker-wallet:vault-unlock-until";
const unlockDurationMs = 10 * 60 * 1000;

export function unlockVault() {
  const unlockUntil = Date.now() + unlockDurationMs;
  window.localStorage.setItem(storageKey, String(unlockUntil));
  window.dispatchEvent(new Event("maker-wallet:vault-unlock-changed"));

  return unlockUntil;
}

export function lockVault() {
  window.localStorage.removeItem(storageKey);
  window.dispatchEvent(new Event("maker-wallet:vault-unlock-changed"));
}

export function getVaultUnlockUntil() {
  const raw = window.localStorage.getItem(storageKey);
  const unlockUntil = raw ? Number(raw) : 0;

  return Number.isFinite(unlockUntil) ? unlockUntil : 0;
}

export function isVaultUnlocked() {
  return getVaultUnlockUntil() > Date.now();
}
