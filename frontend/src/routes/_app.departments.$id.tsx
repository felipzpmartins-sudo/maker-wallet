import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Plus, KeyRound, Search, ShieldX } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  ACCESS_TYPE_LABELS,
  departmentIcons,
  getAccessDepartmentIds,
  type AccessEntry,
  type AccessType,
} from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccessCard } from "@/components/AccessCard";
import { AccessForm } from "@/components/AccessForm";
import { ConfidentialBadge } from "@/components/ConfidentialBadge";
import { ListPagination } from "@/components/ListPagination";
import { sortByName } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/departments/$id")({
  component: DepartmentDetailPage,
});

function DepartmentDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const {
    currentUser,
    departments,
    accesses,
    canAccessDepartment,
    isAdmin,
    isCeo,
    saveAccess,
    deleteAccess,
  } = useAuth();

  const department = departments.find((d) => d.id === id);
  const allowed = canAccessDepartment(id);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AccessEntry | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AccessType | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (!department) navigate({ to: "/departments" });
  }, [department, navigate]);

  const filteredAccesses = useMemo(
    () => {
      const normalizedSearch = search.trim().toLowerCase();
      return sortByName(accesses.filter((access) => {
        const matchesDepartment = getAccessDepartmentIds(access).includes(id);
        const matchesType = typeFilter === "all" || access.type === typeFilter;
        const searchable = [
          access.name,
          access.email,
          access.username,
          access.host,
          access.appName,
          access.networkName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);
        return matchesDepartment && matchesType && matchesSearch;
      }));
    },
    [accesses, id, search, typeFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, pageSize, id]);

  const paginatedAccesses = useMemo(
    () => filteredAccesses.slice((page - 1) * pageSize, page * pageSize),
    [filteredAccesses, page, pageSize],
  );

  if (!department) return null;
  const canCreateAccess = !!currentUser && currentUser.role !== "pending";

  if (!allowed) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center">
        <ShieldX className="h-12 w-12 text-warning" />
        <h2 className="font-display text-xl font-semibold">Sem permissão</h2>
        <p className="text-sm text-muted-foreground">
          Você não tem nenhum acesso liberado neste departamento.
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

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 lg:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filtrar por nome, e-mail, usuario ou host"
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as AccessType | "all")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {(Object.keys(ACCESS_TYPE_LABELS) as AccessType[]).map((type) => (
              <SelectItem key={type} value={type}>
                {ACCESS_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredAccesses.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Nenhum acesso encontrado neste departamento.
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
                onEdit={(a) => {
                  setEditing(a);
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

      {canCreateAccess && (
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
