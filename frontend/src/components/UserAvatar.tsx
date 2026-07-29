import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getApiAssetUrl } from "@/lib/api";
import { getAvatarColor, getInitials, getPresetAvatar, isAdminAvatarPreset } from "@/lib/avatars";
import type { AppUser } from "@/lib/mock-data";

interface UserAvatarProps {
  user?: Pick<AppUser, "name" | "avatarUrl" | "avatarPreset"> | null;
  className?: string;
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  const preset = getPresetAvatar(user?.avatarPreset);
  const source = getApiAssetUrl(user?.avatarUrl) ?? preset?.src;
  const isAdminAvatar = isAdminAvatarPreset(user?.avatarPreset);

  return (
    <Avatar className={`${className ?? ""} ${isAdminAvatar ? "avatar-admin" : ""}`}>
      {source && (
        <AvatarImage
          className={isAdminAvatar ? "avatar-admin-image" : undefined}
          src={source}
          alt={`Avatar de ${user?.name ?? "usuário"}`}
        />
      )}
      <AvatarFallback
        className="font-display text-xs font-semibold text-white"
        style={{ backgroundColor: getAvatarColor(user?.name) }}
      >
        {getInitials(user?.name)}
      </AvatarFallback>
    </Avatar>
  );
}
