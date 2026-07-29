import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useAdminGuard } from "@/hooks/use-admin-guard";
import { ACCESS_TYPE_LABELS, ROLE_LABELS, getAccessDepartmentIds } from "@/lib/mock-data";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/UserAvatar";
import { sortByName } from "@/lib/utils";

export const Route = createFileRoute("/_app/permissions")({
  component: PermissionsPage,
});

function PermissionsPage() {
  const allowed = useAdminGuard("permissions");
  const {
    users,
    accesses,
    departments,
    currentUser,
    isCeo,
    updateUser,
    listUserAccessIds,
    setAccessPermission,
  } = useAuth();
  const [search, setSearch] = useState("");
  const [accessIdsByUser, setAccessIdsByUser] = useState<Record<string, string[]>>({});
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [pendingKeys, setPendingKeys] = useState<string[]>([]);
  const [openUserIds, setOpenUserIds] = useState<string[]>([]);
  const [openDepartmentIds, setOpenDepartmentIds] = useState<string[]>([]);

  const managed = useMemo(
    () =>
      sortByName(
        users.filter((u) => {
          if (u.role === "ceo" || u.role === "pending") return false;
          if (!isCeo && u.id === currentUser?.id) return false;
          return u.role === "user" || u.role === "admin";
        }),
      ),
    [currentUser?.id, isCeo, users],
  );

  const managedUserIds = useMemo(() => managed.map((u) => u.id).join("|"), [managed]);
  const permissionSubjects = useMemo(
    () => sortByName(users.filter((user) => user.role !== "pending")),
    [users],
  );
  const permissionSubjectIds = useMemo(
    () => permissionSubjects.map((user) => user.id).join("|"),
    [permissionSubjects],
  );
  const departmentById = useMemo(
    () => new Map(departments.map((department) => [department.id, department.name])),
    [departments],
  );
  const filteredAccesses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sortByName(
      accesses.filter((access) => {
        if (!query) return true;
        const departmentNames = getAccessDepartmentIds(access)
          .map((departmentId) => departmentById.get(departmentId))
          .filter(Boolean);
        return [
          access.name,
          access.username,
          access.email,
          access.link,
          access.host,
          access.appName,
          access.networkName,
          ACCESS_TYPE_LABELS[access.type],
          ...departmentNames,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query));
      }),
    );
  }, [accesses, departmentById, search]);
  const accessById = useMemo(
    () => new Map(accesses.map((access) => [access.id, access])),
    [accesses],
  );
  const departmentMembers = useMemo(
    () =>
      sortByName(departments).map((department) => ({
        department,
        people: permissionSubjects.filter((user) =>
          (accessIdsByUser[user.id] ?? []).some((accessId) => {
            const access = accessById.get(accessId);
            return access ? getAccessDepartmentIds(access).includes(department.id) : false;
          }),
        ),
      })),
    [accessById, accessIdsByUser, departments, permissionSubjects],
  );

  useEffect(() => {
    if (!permissionSubjects.length) {
      setAccessIdsByUser({});
      return;
    }

    let cancelled = false;
    setLoadingPermissions(true);

    Promise.all(
      permissionSubjects.map(async (user) => {
        const ids = await listUserAccessIds(user.id);
        return [user.id, ids] as const;
      }),
    )
      .then((entries) => {
        if (cancelled) return;
        setAccessIdsByUser(Object.fromEntries(entries));
      })
      .catch(() => {
        if (!cancelled) toast.error("Nao foi possivel carregar as permissoes.");
      })
      .finally(() => {
        if (!cancelled) setLoadingPermissions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [listUserAccessIds, permissionSubjectIds, permissionSubjects]);

  if (!allowed) return null;

  const toggleUserOpen = (userId: string, open: boolean) => {
    setOpenUserIds((current) =>
      open ? Array.from(new Set([...current, userId])) : current.filter((id) => id !== userId),
    );
  };

  const toggleDepartmentOpen = (departmentId: string, open: boolean) => {
    setOpenDepartmentIds((current) =>
      open
        ? Array.from(new Set([...current, departmentId]))
        : current.filter((id) => id !== departmentId),
    );
  };

  const toggleAccess = async (userId: string, accessId: string, checked: boolean) => {
    const key = `${userId}:${accessId}`;
    const previous = accessIdsByUser[userId] ?? [];
    const next = checked
      ? Array.from(new Set([...previous, accessId]))
      : previous.filter((id) => id !== accessId);

    setAccessIdsByUser((current) => ({ ...current, [userId]: next }));
    setPendingKeys((current) => [...current, key]);

    try {
      await setAccessPermission(accessId, userId, { canView: checked });
      toast.success(checked ? "Acesso liberado" : "Acesso removido");
    } catch {
      setAccessIdsByUser((current) => ({ ...current, [userId]: previous }));
      toast.error("Nao foi possivel atualizar este acesso.");
    } finally {
      setPendingKeys((current) => current.filter((item) => item !== key));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Permissoes</h1>
          <p className="text-sm text-muted-foreground">
            Libere acessos item a item para cada usuario.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar acesso"
          />
        </div>
      </div>

      {departments.length > 0 && (
        <section className="wallet-card rounded-2xl border border-border p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-semibold">Pessoas por departamento</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Veja quantas pessoas têm acesso e expanda para consultar os nomes.
              </p>
            </div>
            <Badge variant="outline">{permissionSubjects.length} pessoa(s) aprovada(s)</Badge>
          </div>

          <div className="mt-4 grid gap-2 lg:grid-cols-2">
            {departmentMembers.map(({ department, people }) => {
              const isOpen = openDepartmentIds.includes(department.id);
              return (
                <Collapsible
                  key={department.id}
                  open={isOpen}
                  onOpenChange={(open) => toggleDepartmentOpen(department.id, open)}
                  className="rounded-xl border border-border bg-background/35"
                >
                  <button
                    type="button"
                    onClick={() => toggleDepartmentOpen(department.id, !isOpen)}
                    className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-accent/60"
                    aria-expanded={isOpen}
                  >
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "" : "-rotate-90"}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {department.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {department.description}
                      </span>
                    </span>
                    <Badge variant="secondary" className="shrink-0">
                      {people.length} pessoa(s)
                    </Badge>
                  </button>

                  <CollapsibleContent>
                    <div className="border-t border-border px-3 py-2">
                      {loadingPermissions ? (
                        <p className="px-2 py-2 text-sm text-muted-foreground">
                          Carregando pessoas...
                        </p>
                      ) : people.length === 0 ? (
                        <p className="px-2 py-2 text-sm text-muted-foreground">
                          Nenhuma pessoa com acesso neste departamento.
                        </p>
                      ) : (
                        <ul className="space-y-1">
                          {people.map((person) => (
                            <li
                              key={person.id}
                              className="flex items-center gap-2.5 rounded-lg px-2 py-2"
                            >
                              <UserAvatar user={person} className="h-7 w-7" />
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium">
                                  {person.name}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {person.email}
                                </span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </section>
      )}

      {managed.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Nenhum usuario aprovado para gerenciar.
        </div>
      ) : accesses.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Nenhum acesso cadastrado.
        </div>
      ) : (
        <div className="space-y-4">
          {managed.map((user) => {
            const total = user.role === "ceo" || !!user.totalAccess;
            const userAccessIds = accessIdsByUser[user.id] ?? [];
            const isOpen = openUserIds.includes(user.id);

            return (
              <Collapsible
                key={user.id}
                open={isOpen}
                onOpenChange={(open) => toggleUserOpen(user.id, open)}
                className="rounded-2xl border border-border bg-card"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <Button
                    type="button"
                    variant="ghost"
                    className="-ml-2 h-auto min-w-0 justify-start px-2 py-1 text-left hover:bg-transparent"
                    onClick={() => toggleUserOpen(user.id, !isOpen)}
                    aria-expanded={isOpen}
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isOpen ? "" : "-rotate-90"}`}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{user.name}</span>
                      <span className="block truncate text-sm font-normal text-muted-foreground">
                        {user.email}
                      </span>
                    </span>
                  </Button>

                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
                    <Badge variant="outline">{userAccessIds.length} acesso(s)</Badge>
                    {isCeo && (
                      <label className="flex items-center gap-2 text-sm">
                        Acesso total
                        <Switch
                          checked={total}
                          onCheckedChange={(checked) => {
                            updateUser(user.id, {
                              totalAccess: checked,
                              allowedDepartments: [],
                            });
                            setAccessIdsByUser((current) => ({
                              ...current,
                              [user.id]: checked ? accesses.map((access) => access.id) : [],
                            }));
                            toast(checked ? "Acesso total liberado" : "Acesso total removido", {
                              description: user.name,
                            });
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <CollapsibleContent>
                  <div className="space-y-2 border-t border-border p-5 pt-4">
                    {loadingPermissions ? (
                      <div className="rounded-lg border border-border bg-background/40 px-3 py-3 text-sm text-muted-foreground">
                        Carregando permissoes...
                      </div>
                    ) : filteredAccesses.length === 0 ? (
                      <div className="rounded-lg border border-border bg-background/40 px-3 py-3 text-sm text-muted-foreground">
                        Nenhum acesso encontrado para esta busca.
                      </div>
                    ) : (
                      filteredAccesses.map((access) => {
                        const key = `${user.id}:${access.id}`;
                        const checked = userAccessIds.includes(access.id);
                        const departmentNames = getAccessDepartmentIds(access)
                          .map((departmentId) => departmentById.get(departmentId))
                          .filter(Boolean)
                          .join(", ");

                        return (
                          <label
                            key={access.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm"
                          >
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{access.name}</span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {ACCESS_TYPE_LABELS[access.type]}
                                {departmentNames ? ` - ${departmentNames}` : ""}
                              </span>
                            </span>
                            <Switch
                              checked={checked}
                              disabled={pendingKeys.includes(key)}
                              onCheckedChange={(nextChecked) =>
                                toggleAccess(user.id, access.id, nextChecked)
                              }
                            />
                          </label>
                        );
                      })
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}
