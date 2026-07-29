import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getApiAssetUrl } from "@/lib/api";
import { getAvatarColor, getInitials, getPresetAvatar } from "@/lib/avatars";
import type { AppUser } from "@/lib/mock-data";

interface UserAvatarProps {
  user?: Pick<AppUser, "name" | "avatarUrl" | "avatarPreset"> | null;
  className?: string;
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  const preset = getPresetAvatar(user?.avatarPreset);
  const source = getApiAssetUrl(user?.avatarUrl) ?? preset?.src;

  return (
    <Avatar className={className}>
      {source && <AvatarImage src={source} alt={`Avatar de ${user?.name ?? "usuário"}`} />}
      <AvatarFallback
        className="font-display text-xs font-semibold text-white"
        style={{ backgroundColor: getAvatarColor(user?.name) }}
      >
        {getInitials(user?.name)}
      </AvatarFallback>
    </Avatar>
  );
}
