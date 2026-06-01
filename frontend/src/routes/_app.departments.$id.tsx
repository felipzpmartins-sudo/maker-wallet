import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Plus, KeyRound, ShieldX } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { departmentIcons, getAccessDepartmentIds, type AccessEntry } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { AccessCard } from "@/components/AccessCard";
import { AccessForm } from "@/components/AccessForm";
import { ConfidentialBadge } from "@/components/ConfidentialBadge";

export const Route = createFileRoute("/_app/departments/$id")({
  component: DepartmentDetailPage,
});

function DepartmentDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { departments, accesses, canAccessDepartment, isAdmin, isCeo, saveAccess, deleteAccess } =
    useAuth();

  const department = departments.find((d) => d.id === id);
  const allowed = canAccessDepartment(id);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AccessEntry | null>(null);

  useEffect(() => {
    if (!department) navigate({ to: "/departments" });
  }, [department, navigate]);

  const deptAccesses = useMemo(
    () => accesses.filter((a) => getAccessDepartmentIds(a).includes(id)),
    [accesses, id],
  );

  if (!department) return null;

  if (!allowed) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center">
        <ShieldX className="h-12 w-12 text-warning" />
        <h2 className="font-display text-xl font-semibold">Sem permissão</h2>
        <p className="text-sm text-muted-foreground">
          Você não tem acesso a este departamento. Solicite a um administrador.
        </p>
        <Button asChild variant="outline">
          <Link to="/departments">Voltar aos departamentos</Link>
        </Button>
      </div>
    );
  }

  const Icon = departmentIcons[department.iconKey] ?? KeyRound;

  return (
    <div className="space-y-6">
      <Link
        to="/departments"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Departamentos
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold">{department.name}</h1>
            <p className="text-sm text-muted-foreground">{department.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ConfidentialBadge />
          {isAdmin && (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus /> Novo acesso
            </Button>
          )}
        </div>
      </div>

      {deptAccesses.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Nenhum acesso cadastrado neste departamento.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {deptAccesses.map((access) => (
            <AccessCard
              key={access.id}
              access={access}
              departments={departments}
              canManage={isAdmin}
              onEdit={(a) => {
                setEditing(a);
                setFormOpen(true);
              }}
              onDelete={deleteAccess}
            />
          ))}
        </div>
      )}

      {isAdmin && (
        <AccessForm
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditing(null);
          }}
          departmentId={id}
          departments={departments}
          allowMultiDepartment={isCeo}
          initial={editing}
          onSave={saveAccess}
        />
      )}
    </div>
  );
}
