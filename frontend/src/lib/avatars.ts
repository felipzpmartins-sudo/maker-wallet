export const avatarPresets = [
  { id: "orbit", label: "Órbita", src: "/assets/avatars/orbit.svg" },
  { id: "pulse", label: "Pulso", src: "/assets/avatars/pulse.svg" },
  { id: "spark", label: "Faísca", src: "/assets/avatars/spark.svg" },
  { id: "pixel", label: "Pixel", src: "/assets/avatars/pixel.svg" },
  { id: "nova", label: "Nova", src: "/assets/avatars/nova.svg" },
  { id: "circuit", label: "Circuito", src: "/assets/avatars/circuit.svg" },
  { id: "prisma", label: "Prisma", src: "/assets/avatars/prisma.svg" },
  { id: "flux", label: "Fluxo", src: "/assets/avatars/flux.svg" },
] as const;

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
