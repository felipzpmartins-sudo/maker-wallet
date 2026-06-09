const unlockDurationMs = 60 * 1000;
let vaultUnlockUntil = 0;
let lockTimer: number | undefined;

function emitUnlockChanged() {
  window.dispatchEvent(new Event("maker-wallet:vault-unlock-changed"));
}

function clearLockTimer() {
  if (lockTimer !== undefined) {
    window.clearTimeout(lockTimer);
    lockTimer = undefined;
  }
}

function scheduleLock() {
  clearLockTimer();

  const remainingMs = vaultUnlockUntil - Date.now();
  if (remainingMs <= 0) {
    lockVault();
    return;
  }

  lockTimer = window.setTimeout(() => {
    lockVault();
  }, remainingMs);
}

export function unlockVault() {
  const unlockUntil = Date.now() + unlockDurationMs;
  vaultUnlockUntil = unlockUntil;
  scheduleLock();
  emitUnlockChanged();

  return unlockUntil;
}

export function lockVault() {
  clearLockTimer();
  vaultUnlockUntil = 0;
  emitUnlockChanged();
}

export function getVaultUnlockUntil() {
  return vaultUnlockUntil;
}

export function isVaultUnlocked() {
  return getVaultUnlockUntil() > Date.now();
}
