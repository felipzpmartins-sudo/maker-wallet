import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus, Boxes, Copy } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAdminGuard } from "@/hooks/use-admin-guard";
import { departmentIcons, ROLE_LABELS, type Department } from "@/lib/mock-data";
import { buildRegistrationInviteUrl } from "@/lib/invite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfidentialBadge } from "@/components/ConfidentialBadge";

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
  const allowed = useAdminGuard("ceo");
  const { departments, addDepartment } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");

  useEffect(() => {
    setInviteUrl(buildRegistrationInviteUrl(window.location.origin));
  }, []);

  if (!allowed) return null;

  const create = () => {
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
    addDepartment(dep);
    setName("");
    setDescription("");
    toast.success("Departamento criado", { description: dep.name });
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
          {departments.map((d) => {
            const Icon = departmentIcons[d.iconKey] ?? Boxes;
            return (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-background/40 px-3 py-2.5"
              >
                <Icon className="h-4 w-4 text-primary" />
                <span className="truncate text-sm">{d.name}</span>
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
