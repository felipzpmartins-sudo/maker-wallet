import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus, Boxes, Copy, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAdminGuard } from "@/hooks/use-admin-guard";
import { departmentIcons, ROLE_LABELS, type Department } from "@/lib/mock-data";
import { buildRegistrationInviteUrl } from "@/lib/invite";
import { sortByName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfidentialBadge } from "@/components/ConfidentialBadge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function SettingsPage() {
  const allowed = useAdminGuard("admin");
  const { departments, addDepartment, updateDepartment, deleteDepartment } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const sortedDepartments = useMemo(() => sortByName(departments), [departments]);

  useEffect(() => {
    setInviteUrl(buildRegistrationInviteUrl(window.location.origin));
  }, []);

  if (!allowed) return null;

  const create = async () => {
    if (!name.trim()) return;
    const id = slugify(name) || `dep-${Date.now()}`;
    if (departments.some((d) => d.id === id)) {
      toast.error("Departamento já existe");
      return;
    }
    const dep: Department = {
      id,
      name: name.trim(),
      iconKey: "outros",
      description: description.trim() || "Departamento personalizado",
    };
    try {
      await addDepartment(dep);
      setName("");
      setDescription("");
      toast.success("Departamento criado", { description: dep.name });
    } catch {
      toast.error("Nao foi possivel criar o departamento");
    }
  };

  const copyInvite = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    toast.success("Link de convite copiado");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Configurações</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie departamentos e níveis de acesso.
          </p>
        </div>
        <ConfidentialBadge />
      </div>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Convite de cadastro</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Envie este link somente para pessoas autorizadas a criar uma conta.
            </p>
          </div>
          <Button onClick={copyInvite}>
            <Copy /> Copiar link
          </Button>
        </div>
        <Input className="mt-4 font-mono text-xs" readOnly value={inviteUrl} />
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Novo departamento</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Jurídico"
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição"
            />
          </div>
        </div>
        <Button className="mt-4" onClick={create}>
          <Plus /> Criar departamento
        </Button>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Departamentos existentes</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {sortedDepartments.map((d) => {
            const Icon = departmentIcons[d.iconKey] ?? Boxes;
            return (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-background/40 px-3 py-2.5"
              >
                <Icon className="h-4 w-4 text-primary" />
                <span className="min-w-0 flex-1 truncate text-sm">{d.name}</span>
                <DepartmentEditDialog department={d} onSave={updateDepartment} />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir departamento?</AlertDialogTitle>
                      <AlertDialogDescription>
                        O departamento "{d.name}" sera removido das permissoes dos usuarios e da
                        lista de departamentos. Esta acao nao pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          try {
                            await deleteDepartment(d.id);
                            toast.success("Departamento excluido", { description: d.name });
                          } catch {
                            toast.error("Nao foi possivel excluir o departamento");
                          }
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Excluir departamento
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Níveis de acesso</h2>
        <ul className="mt-4 space-y-3 text-sm">
          <li>
            <span className="font-medium text-primary">{ROLE_LABELS.ceo}:</span> acesso total a
            todos os departamentos e configurações.
          </li>
          <li>
            <span className="font-medium text-primary">{ROLE_LABELS.admin}:</span> acesso aos
            setores e permissões definidos pelo CEO.
          </li>
          <li>
            <span className="font-medium">{ROLE_LABELS.user}:</span> acesso apenas aos departamentos
            liberados.
          </li>
          <li>
            <span className="font-medium text-warning">{ROLE_LABELS.pending}:</span> cadastrado, mas
            sem acesso liberado ainda.
          </li>
        </ul>
      </section>
    </div>
  );
}

function DepartmentEditDialog({
  department,
  onSave,
}: {
  department: Department;
  onSave: (id: string, patch: Partial<Department>) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(department.name);
  const [description, setDescription] = useState(department.description);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(department.name);
    setDescription(department.description);
  }, [department, open]);

  const save = async () => {
    const nextName = name.trim();
    if (!nextName) return;

    setSaving(true);
    try {
      await onSave(department.id, {
        name: nextName,
        description: description.trim() || "Departamento personalizado",
        iconKey: department.iconKey,
      });
      toast.success("Departamento atualizado", { description: nextName });
      setOpen(false);
    } catch {
      toast.error("Nao foi possivel atualizar o departamento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
          aria-label="Editar departamento"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar departamento</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Descricao</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving || !name.trim()}>
            {saving ? "Salvando..." : "Salvar alteracoes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
