import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, KeyRound, Plus, Search, ShieldX } from "lucide-react";
import { AccessCard } from "@/components/AccessCard";
import { AccessForm } from "@/components/AccessForm";
import { ConfidentialBadge } from "@/components/ConfidentialBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import {
  departmentIcons,
  getAccessDepartmentIds,
  ROLE_LABELS,
  type AccessEntry,
} from "@/lib/mock-data";

export const Route = createFileRoute("/_app/departments/")({
  component: DepartmentsPage,
});

function DepartmentsPage() {
  const {
    currentUser,
    visibleDepartments,
    accesses,
    departments,
    isCeo,
    isAdmin,
    saveAccess,
    deleteAccess,
  } = useAuth();
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AccessEntry | null>(null);

  const filteredAccesses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return accesses.filter((access) => {
      const departmentIds = getAccessDepartmentIds(access);
      const matchesArea = areaFilter === "all" || departmentIds.includes(areaFilter);
      const matchesSearch =
        !query ||
        [
          access.name,
          access.username,
          access.email,
          access.link,
          access.host,
          access.appName,
          access.networkName,
          access.notes,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query));

      return matchesArea && matchesSearch;
    });
  }, [accesses, areaFilter, search]);

  if (currentUser?.role === "pending") {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center">
        <ShieldX className="h-12 w-12 text-warning" />
        <h2 className="font-display text-xl font-semibold">Acesso aguardando liberacao</h2>
        <p className="text-sm text-muted-foreground">
          Sua conta foi criada e esta aguardando liberacao de acesso por um administrador. Assim que
          for aprovado, seus departamentos aparecerao aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {!isCeo && (
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Bem-vindo, <span className="text-foreground">{currentUser?.name}</span>
              {currentUser && (
                <>
                  {" "}
                  - <span className="text-primary">{ROLE_LABELS[currentUser.role]}</span>
                </>
              )}
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold">Departamentos</h1>
          </div>
          <ConfidentialBadge />
        </div>
      )}

      {!isCeo && visibleDepartments.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Nenhum departamento liberado para voce.
        </div>
      ) : !isCeo ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleDepartments.map((dep) => {
            const Icon = departmentIcons[dep.iconKey] ?? KeyRound;
            const count = accesses.filter((access) =>
              getAccessDepartmentIds(access).includes(dep.id),
            ).length;

            return (
              <Link
                key={dep.id}
                to="/departments/$id"
                params={{ id: dep.id }}
                className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-[var(--shadow-glow)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{dep.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{dep.description}</p>
                <p className="mt-3 text-xs font-medium text-primary">{count} acesso(s)</p>
              </Link>
            );
          })}
        </div>
      ) : null}

      {isCeo && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-semibold">Acessos em lista</h1>
              <p className="text-sm text-muted-foreground">
                Pesquise pelo acesso ou filtre pela area vinculada.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus /> Novo acesso
              </Button>
              <div className="relative sm:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Pesquisar acesso"
                />
              </div>
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger className="sm:w-56">
                  <SelectValue placeholder="Filtrar por area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as areas</SelectItem>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredAccesses.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Nenhum acesso encontrado para este filtro.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredAccesses.map((access) => (
                <AccessCard
                  key={access.id}
                  access={access}
                  departments={departments}
                  canManage={isAdmin}
                  onEdit={(selectedAccess) => {
                    setEditing(selectedAccess);
                    setFormOpen(true);
                  }}
                  onDelete={deleteAccess}
                />
              ))}
            </div>
          )}

          <AccessForm
            open={formOpen}
            onOpenChange={(open) => {
              setFormOpen(open);
              if (!open) setEditing(null);
            }}
            departmentId={departments[0]?.id ?? "outros"}
            departments={departments}
            allowMultiDepartment
            initial={editing}
            onSave={saveAccess}
          />
        </section>
      )}
    </div>
  );
}
