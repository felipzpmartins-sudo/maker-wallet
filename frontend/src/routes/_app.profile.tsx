import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Camera, CheckCircle2, Mail, Save, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { AvatarSelector } from "@/components/AvatarSelector";
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload";
import { UserAvatar } from "@/components/UserAvatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiAssetUrl } from "@/lib/api";
import { getAvatarColor, getInitials, getPresetAvatar } from "@/lib/avatars";
import { useAuth } from "@/lib/auth-context";
import { ROLE_LABELS } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { currentUser, updateProfile, uploadProfilePhoto, removeProfilePhoto } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarPreset, setAvatarPreset] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string>();
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setName(currentUser.name);
    setEmail(currentUser.email);
    setAvatarPreset(currentUser.avatarPreset ?? null);
    setSelectedFile(null);
    setPhotoRemoved(false);
  }, [currentUser]);

  useEffect(() => () => {
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
  }, [localPreviewUrl]);

  const savedPhotoUrl = photoRemoved ? undefined : getApiAssetUrl(currentUser?.avatarUrl);
  const presetImage = getPresetAvatar(avatarPreset)?.src;
  const previewImage = localPreviewUrl ?? savedPhotoUrl ?? presetImage;
  const canSave = !!currentUser && !!name.trim() && !!email.trim() && !saving;

  const cancel = () => {
    if (!currentUser) return;
    setName(currentUser.name);
    setEmail(currentUser.email);
    setAvatarPreset(currentUser.avatarPreset ?? null);
    setSelectedFile(null);
    setLocalPreviewUrl(undefined);
    setPhotoRemoved(false);
  };

  const save = async () => {
    if (!currentUser || !canSave) return;
    setSaving(true);
    try {
      if (photoRemoved && currentUser.avatarUrl) await removeProfilePhoto();
      if (selectedFile) await uploadProfilePhoto(selectedFile);
      await updateProfile({ name: name.trim(), email: email.trim(), avatarPreset: selectedFile ? null : avatarPreset });
      toast.success("Perfil atualizado", { description: "Suas preferências foram salvas." });
      setSelectedFile(null);
      setPhotoRemoved(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar seu perfil.");
    } finally {
      setSaving(false);
    }
  };

  const profileSummary = useMemo(() => {
    if (!currentUser) return "";
    return `${ROLE_LABELS[currentUser.role]} · acesso protegido`;
  }, [currentUser]);

  if (!currentUser) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">IDENTIDADE E PREFERÊNCIAS</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Meu perfil</h1>
          <p className="mt-2 text-sm text-muted-foreground">Gerencie seus dados e a aparência da sua conta.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
          <CheckCircle2 className="h-4 w-4" /> Conta ativa
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section className="wallet-card rounded-[1.35rem] border border-border p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary"><UserRound className="h-5 w-5" /></span>
            <div><h2 className="font-display text-lg font-semibold">Dados da conta</h2><p className="text-sm text-muted-foreground">Informações usadas no seu acesso.</p></div>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="profile-name">Nome</Label><Input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></div>
            <div className="space-y-2"><Label htmlFor="profile-email">E-mail</Label><div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="profile-email" className="pl-9" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" /></div></div>
          </div>
        </section>

        <aside className="wallet-card flex flex-col items-center rounded-[1.35rem] border border-border p-6 text-center">
          <Avatar className="h-28 w-28 border-4 border-background shadow-[var(--shadow-glow)]">
            {previewImage && <AvatarImage src={previewImage} alt={`Prévia do avatar de ${name || currentUser.name}`} />}
            <AvatarFallback className="font-display text-xl font-semibold text-white" style={{ backgroundColor: getAvatarColor(name) }}>{getInitials(name)}</AvatarFallback>
          </Avatar>
          <h2 className="mt-4 font-display text-lg font-semibold">{name || currentUser.name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{profileSummary}</p>
          <div className="mt-5 flex w-full items-center gap-2 rounded-xl bg-background/50 p-3 text-left"><Camera className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">A imagem será exibida na barra superior e no menu.</span></div>
        </aside>
      </div>

      <section className="wallet-card rounded-[1.35rem] border border-border p-5 sm:p-7">
        <h2 className="font-display text-lg font-semibold">Foto de perfil</h2>
        <p className="mt-1 text-sm text-muted-foreground">Envie uma imagem pessoal ou institucional. Você poderá revisar a prévia antes de salvar.</p>
        <div className="mt-5 max-w-sm">
          <ProfilePhotoUpload
            imageUrl={selectedFile ? undefined : savedPhotoUrl}
            name={name || currentUser.name}
            onChange={(file) => {
              setSelectedFile(file);
              if (file) {
                if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
                setLocalPreviewUrl(URL.createObjectURL(file));
                setAvatarPreset(null);
                setPhotoRemoved(false);
              } else {
                setLocalPreviewUrl(undefined);
              }
            }}
            onRemove={() => setPhotoRemoved(true)}
          />
        </div>
      </section>

      <section className="wallet-card rounded-[1.35rem] border border-border p-5 sm:p-7">
        <h2 className="font-display text-lg font-semibold">Avatares Maker</h2>
        <p className="mt-1 text-sm text-muted-foreground">Escolha uma alternativa visual. A seleção substitui a foto de perfil ao salvar.</p>
        <div className="mt-5 max-w-xl">
          <AvatarSelector value={avatarPreset} onChange={(avatarId) => { setAvatarPreset(avatarId); setSelectedFile(null); setLocalPreviewUrl(undefined); setPhotoRemoved(true); }} />
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-3 pb-4">
        <Button type="button" variant="ghost" onClick={cancel} disabled={saving}><X /> Cancelar</Button>
        <Button type="button" onClick={save} disabled={!canSave}><Save /> {saving ? "Salvando..." : "Salvar alterações"}</Button>
      </div>
    </div>
  );
}
