const unlockDurationMs = 10 * 60 * 1000;
let vaultUnlockUntil = 0;

export function unlockVault() {
  const unlockUntil = Date.now() + unlockDurationMs;
  vaultUnlockUntil = unlockUntil;
  window.dispatchEvent(new Event("maker-wallet:vault-unlock-changed"));

  return unlockUntil;
}

export function lockVault() {
  vaultUnlockUntil = 0;
  window.dispatchEvent(new Event("maker-wallet:vault-unlock-changed"));
}

export function getVaultUnlockUntil() {
  return vaultUnlockUntil;
}

export function isVaultUnlocked() {
  return getVaultUnlockUntil() > Date.now();
}
