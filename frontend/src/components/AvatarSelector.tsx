import { Check, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { adminAvatarPresets, makerAvatarPresets } from "@/lib/avatars";

interface AvatarSelectorProps {
  value?: string | null;
  onChange: (avatarId: string) => void;
  isAdmin: boolean;
}

interface AvatarGridProps {
  value?: string | null;
  onChange: (avatarId: string) => void;
  avatars: readonly { id: string; label: string; src: string; adminOnly?: boolean }[];
}

function AvatarGrid({ value, onChange, avatars }: AvatarGridProps) {
  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
      {avatars.map((avatar) => {
        const selected = value === avatar.id;
        return (
          <button
            key={avatar.id}
            type="button"
            onClick={() => onChange(avatar.id)}
            className={`group relative aspect-square overflow-hidden rounded-2xl border border-border bg-card p-1 transition duration-200 hover:-translate-y-0.5 hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${avatar.adminOnly ? "admin-avatar-option" : ""}`}
            aria-label={`Selecionar avatar ${avatar.label}`}
            aria-pressed={selected}
          >
            <img className="h-full w-full rounded-xl object-cover" src={avatar.src} alt="" />
            {avatar.adminOnly && (
              <span className="absolute right-1.5 top-1.5 rounded-full bg-background/80 p-1 text-warning shadow-sm backdrop-blur">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              </span>
            )}
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

export function AvatarSelector({ value, onChange, isAdmin }: AvatarSelectorProps) {
  return (
    <div className="space-y-5">
      <AvatarGrid value={value} onChange={onChange} avatars={makerAvatarPresets} />
      {isAdmin ? (
        <div className="rounded-2xl border border-warning/25 bg-warning/5 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-warning">
            <Sparkles className="h-4 w-4" /> Avatares de administração
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            Coleção exclusiva, com animações sutis para identificar quem administra a Central.
          </p>
          <AvatarGrid value={value} onChange={onChange} avatars={adminAvatarPresets} />
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
          <LockKeyhole className="h-3.5 w-3.5 shrink-0" /> Avatares especiais são reservados à
          administração.
        </div>
      )}
    </div>
  );
}
