import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACCESS_TYPE_LABELS,
  getAccessDepartmentIds,
  type AccessEntry,
  type AccessType,
  type Department,
} from "@/lib/mock-data";
import { ApiError } from "@/lib/api";
import { sortByName } from "@/lib/utils";

interface AccessFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentId: string;
  departments?: Department[];
  allowMultiDepartment?: boolean;
  initial?: AccessEntry | null;
  onSave: (access: AccessEntry) => Promise<void>;
}

const emptyDraft = (departmentId: string): AccessEntry => ({
  id: `a${Date.now()}`,
  departmentId,
  type: "platform",
  name: "",
  password: "",
});

export function AccessForm({
  open,
  onOpenChange,
  departmentId,
  departments = [],
  allowMultiDepartment,
  initial,
  onSave,
}: AccessFormProps) {
  const [draft, setDraft] = useState<AccessEntry>(emptyDraft(departmentId));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const next = initial ? { ...initial } : emptyDraft(departmentId);
      setDraft({
        ...next,
        departmentIds: getAccessDepartmentIds(next),
      });
    }
  }, [open, initial, departmentId]);

  const set = (patch: Partial<AccessEntry>) => setDraft((d) => ({ ...d, ...patch }));

  const submit = async () => {
    if (saving || !draft.name.trim() || (!initial && !draft.password.trim())) return;
    const selectedDepartmentIds = allowMultiDepartment
      ? getAccessDepartmentIds(draft)
      : [departmentId];
    if (selectedDepartmentIds.length === 0) return;

    setSaving(true);
    try {
      await onSave({
        ...draft,
        departmentId: selectedDepartmentIds[0],
        departmentIds: selectedDepartmentIds,
      });
      toast.success(initial ? "Acesso atualizado" : "Acesso criado");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      const description = error instanceof ApiError ? error.message : undefined;
      toast.error("Nao foi possivel salvar o acesso", { description });
    } finally {
      setSaving(false);
    }
  };

  const type = draft.type;
  const selectedDepartmentIds = getAccessDepartmentIds(draft);
  const sortedDepartments = useMemo(() => sortByName(departments), [departments]);
  const toggleDepartment = (id: string, checked: boolean) => {
    const next = checked
      ? Array.from(new Set([...selectedDepartmentIds, id]))
      : selectedDepartmentIds.filter((departmentId) => departmentId !== id);
    set({ departmentId: next[0] ?? departmentId, departmentIds: next });
  };

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

          {allowMultiDepartment && departments.length > 0 && (
            <div className="space-y-2">
              <Label>Departamentos que usam este acesso</Label>
              <div className="grid max-h-40 gap-2 overflow-y-auto rounded-lg border border-border bg-background/40 p-3 sm:grid-cols-2">
                {sortedDepartments.map((department) => {
                  const checked = selectedDepartmentIds.includes(department.id);
                  return (
                    <label
                      key={department.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => toggleDepartment(department.id, value === true)}
                      />
                      <span className="truncate">{department.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

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
            <>
              <Input
                placeholder="E-mail"
                value={draft.email ?? ""}
                onChange={(e) => set({ email: e.target.value })}
              />
              <Input
                placeholder="URL da caixa de entrada"
                value={draft.link ?? ""}
                onChange={(e) => set({ link: e.target.value })}
              />
            </>
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

          {type === "api_integration" && (
            <>
              <Input
                placeholder="Host"
                value={draft.host ?? ""}
                onChange={(e) => set({ host: e.target.value })}
              />
              <Input
                placeholder="Usuario"
                value={draft.username ?? ""}
                onChange={(e) => set({ username: e.target.value })}
              />
              <Input
                placeholder="ID"
                value={draft.credentialId ?? ""}
                onChange={(e) => set({ credentialId: e.target.value })}
              />
              <Input
                placeholder="Secret"
                value={draft.credentialSecret ?? ""}
                onChange={(e) => set({ credentialSecret: e.target.value })}
              />
              <Input
                placeholder="Token"
                value={draft.credentialToken ?? ""}
                onChange={(e) => set({ credentialToken: e.target.value })}
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
