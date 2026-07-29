import { Check } from "lucide-react";
import { avatarPresets } from "@/lib/avatars";

interface AvatarSelectorProps {
  value?: string | null;
  onChange: (avatarId: string) => void;
}

export function AvatarSelector({ value, onChange }: AvatarSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
      {avatarPresets.map((avatar) => {
        const selected = value === avatar.id;
        return (
          <button
            key={avatar.id}
            type="button"
            onClick={() => onChange(avatar.id)}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-card p-1 transition duration-200 hover:-translate-y-0.5 hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Selecionar avatar ${avatar.label}`}
            aria-pressed={selected}
          >
            <img className="h-full w-full rounded-xl" src={avatar.src} alt="" />
            {selected && (
              <span className="absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-primary bg-primary/15 text-primary">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
