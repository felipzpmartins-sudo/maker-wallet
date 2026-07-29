export const makerAvatarPresets = [
  { id: "orbit", label: "Órbita", src: "/assets/avatars/orbit.svg" },
  { id: "pulse", label: "Pulso", src: "/assets/avatars/pulse.svg" },
  { id: "spark", label: "Faísca", src: "/assets/avatars/spark.svg" },
  { id: "pixel", label: "Pixel", src: "/assets/avatars/pixel.svg" },
  { id: "nova", label: "Nova", src: "/assets/avatars/nova.svg" },
  { id: "circuit", label: "Circuito", src: "/assets/avatars/circuit.svg" },
  { id: "prisma", label: "Prisma", src: "/assets/avatars/prisma.svg" },
  { id: "flux", label: "Fluxo", src: "/assets/avatars/flux.svg" },
] as const;

export const adminAvatarPresets = [
  {
    id: "admin-guardian",
    label: "Guardião",
    src: "/assets/avatars/admin-guardian-final.png",
    adminOnly: true,
  },
  {
    id: "admin-orbit",
    label: "Oráculo",
    src: "/assets/avatars/admin-orbit-final.png",
    adminOnly: true,
  },
  {
    id: "admin-captain",
    label: "Comandante",
    src: "/assets/avatars/admin-captain-final.png",
    adminOnly: true,
  },
  {
    id: "admin-crystal",
    label: "Sentinela",
    src: "/assets/avatars/admin-crystal-final.png",
    adminOnly: true,
  },
] as const;

export const avatarPresets = [...makerAvatarPresets, ...adminAvatarPresets] as const;

const adminAvatarIds = new Set(adminAvatarPresets.map((avatar) => avatar.id));

export function isAdminAvatarPreset(preset?: string | null) {
  return !!preset && adminAvatarIds.has(preset);
}

export function getInitials(name?: string) {
  return (name ?? "MW")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function getAvatarColor(name?: string) {
  const hash = Array.from(name ?? "Maker Wallet").reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return `hsl(${hash % 360} 58% 42%)`;
}

export function getPresetAvatar(preset?: string | null) {
  return avatarPresets.find((avatar) => avatar.id === preset);
}
