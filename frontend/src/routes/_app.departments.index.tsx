import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, KeyRound, Plus, Search, ShieldX } from "lucide-react";
import { AccessCard } from "@/components/AccessCard";
import { AccessForm } from "@/components/AccessForm";
import { ConfidentialBadge } from "@/components/ConfidentialBadge";
import { ListPagination } from "@/components/ListPagination";
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
import { sortByName } from "@/lib/utils";

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const sortedDepartments = useMemo(() => sortByName(departments), [departments]);
  const sortedVisibleDepartments = useMemo(
    () => sortByName(visibleDepartments),
    [visibleDepartments],
  );

  const filteredAccesses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sortByName(
      accesses.filter((access) => {
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
      }),
    );
  }, [accesses, areaFilter, search]);

  useEffect(() => {
    setPage(1);
  }, [areaFilter, pageSize, search]);

  const paginatedAccesses = useMemo(
    () => filteredAccesses.slice((page - 1) * pageSize, page * pageSize),
    [filteredAccesses, page, pageSize],
  );
  const canCreateAccess = !!currentUser && currentUser.role !== "pending";

  if (currentUser?.role === "pending") {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center">
        <ShieldX className="h-12 w-12 text-warning" />
        <h2 className="font-display text-xl font-semibold">Acesso aguardando liberacao</h2>
        <p className="text-sm text-muted-foreground">
          Sua conta foi criada e esta aguardando liberacao de acesso por um administrador. Assim que
          for aprovado, seus acessos aparecerao aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {!isCeo && (
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Bem-vindo, <span className="text-foreground">{currentUser?.name}</span>
              {currentUser && (
                <>
                  {" "}
                  - <span className="text-primary">{ROLE_LABELS[currentUser.role]}</span>
                </>
              )}
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Departamentos</h1>
            <p className="mt-2 text-sm text-muted-foreground">Selecione uma área para consultar seus acessos protegidos.</p>
          </div>
          <div className="flex items-center gap-3">
            <ConfidentialBadge />
            {canCreateAccess && (
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
      )}

      {!isCeo && visibleDepartments.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Nenhum acesso liberado ou cadastrado para voce.
        </div>
      ) : !isCeo ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedVisibleDepartments.map((dep, index) => {
            const Icon = departmentIcons[dep.iconKey] ?? KeyRound;
            const count = accesses.filter((access) =>
              getAccessDepartmentIds(access).includes(dep.id),
            ).length;

            return (
              <Link
                key={dep.id}
                to="/departments/$id"
                params={{ id: dep.id }}
                className="wallet-card group relative min-h-56 overflow-hidden rounded-[1.35rem] border border-border p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[var(--shadow-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
                <div className="flex items-center justify-between">
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background/60 text-muted-foreground transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
                <p className="mt-6 text-[0.65rem] font-bold tracking-[0.18em] text-primary/85">ÁREA {String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-2 font-display text-xl font-semibold tracking-tight">{dep.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{dep.description}</p>
                <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-primary">
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5">{count}</span>
                  {count === 1 ? "acesso disponível" : "acessos disponíveis"}
                </div>
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
                  {sortedDepartments.map((department) => (
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
            <>
              <div className="grid grid-cols-1 gap-4">
                {paginatedAccesses.map((access) => (
                  <AccessCard
                    key={access.id}
                    access={access}
                    departments={departments}
                    canManage={isAdmin}
                    showCreatedBy={isAdmin}
                    onEdit={(selectedAccess) => {
                      setEditing(selectedAccess);
                      setFormOpen(true);
                    }}
                    onDelete={deleteAccess}
                  />
                ))}
              </div>
              <ListPagination
                page={page}
                pageSize={pageSize}
                totalItems={filteredAccesses.length}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </section>
      )}

      {canCreateAccess && (
        <AccessForm
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditing(null);
          }}
          departmentId={sortedDepartments[0]?.id ?? "outros"}
          departments={sortedDepartments}
          allowMultiDepartment
          initial={editing}
          onSave={saveAccess}
        />
      )}
    </div>
  );
}
