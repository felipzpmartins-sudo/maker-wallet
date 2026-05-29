import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACCESS_TYPE_LABELS, type AccessEntry, type AccessType } from "@/lib/mock-data";

interface AccessFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentId: string;
  initial?: AccessEntry | null;
  onSave: (access: AccessEntry) => void;
}

const emptyDraft = (departmentId: string): AccessEntry => ({
  id: `a${Date.now()}`,
  departmentId,
  type: "platform",
  name: "",
  password: "",
});

export function AccessForm({ open, onOpenChange, departmentId, initial, onSave }: AccessFormProps) {
  const [draft, setDraft] = useState<AccessEntry>(emptyDraft(departmentId));

  useEffect(() => {
    if (open) setDraft(initial ? { ...initial } : emptyDraft(departmentId));
  }, [open, initial, departmentId]);

  const set = (patch: Partial<AccessEntry>) => setDraft((d) => ({ ...d, ...patch }));

  const submit = () => {
    if (!draft.name.trim() || !draft.password.trim()) return;
    onSave({ ...draft, departmentId });
    onOpenChange(false);
  };

  const type = draft.type;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar acesso" : "Novo acesso"}</DialogTitle>
          <DialogDescription>Informação confidencial — preencha com cuidado.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de acesso</Label>
            <Select value={type} onValueChange={(v) => set({ type: v as AccessType })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ACCESS_TYPE_LABELS) as AccessType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {ACCESS_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              {type === "keystore"
                ? "Aplicativo"
                : type === "wifi"
                  ? "Nome da rede"
                  : "Nome / descrição"}
            </Label>
            <Input
              value={
                type === "keystore"
                  ? (draft.appName ?? "")
                  : type === "wifi"
                    ? (draft.networkName ?? "")
                    : draft.name
              }
              onChange={(e) => {
                if (type === "keystore") set({ appName: e.target.value, name: e.target.value });
                else if (type === "wifi")
                  set({ networkName: e.target.value, name: e.target.value });
                else set({ name: e.target.value });
              }}
            />
          </div>

          {type === "ssh_ftp" && (
            <>
              <Input
                placeholder="Host"
                value={draft.host ?? ""}
                onChange={(e) => set({ host: e.target.value })}
              />
              <Input
                placeholder="Porta"
                value={draft.port ?? ""}
                onChange={(e) => set({ port: e.target.value })}
              />
              <Input
                placeholder="Usuário"
                value={draft.username ?? ""}
                onChange={(e) => set({ username: e.target.value })}
              />
            </>
          )}

          {type === "email" && (
            <Input
              placeholder="E-mail"
              value={draft.email ?? ""}
              onChange={(e) => set({ email: e.target.value })}
            />
          )}

          {type === "platform" && (
            <>
              <Input
                placeholder="Usuário"
                value={draft.username ?? ""}
                onChange={(e) => set({ username: e.target.value })}
              />
              <Input
                placeholder="E-mail"
                value={draft.email ?? ""}
                onChange={(e) => set({ email: e.target.value })}
              />
              <Input
                placeholder="Link de acesso"
                value={draft.link ?? ""}
                onChange={(e) => set({ link: e.target.value })}
              />
            </>
          )}

          {type === "keystore" && (
            <Input
              placeholder="Arquivo Keystore (nome)"
              value={draft.keystoreFile ?? ""}
              onChange={(e) => set({ keystoreFile: e.target.value })}
            />
          )}

          {type === "wifi" && (
            <Input
              placeholder="Local / observação"
              value={draft.location ?? ""}
              onChange={(e) => set({ location: e.target.value })}
            />
          )}

          <div className="space-y-2">
            <Label>Senha</Label>
            <Input value={draft.password} onChange={(e) => set({ password: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Observação</Label>
            <Textarea value={draft.notes ?? ""} onChange={(e) => set({ notes: e.target.value })} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
