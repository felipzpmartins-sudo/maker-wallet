import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useAdminGuard } from "@/hooks/use-admin-guard";
import {
  ACCESS_TYPE_LABELS,
  ROLE_LABELS,
  getAccessDepartmentIds,
} from "@/lib/mock-data";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
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

  useEffect(() => {
    if (!managed.length) {
      setAccessIdsByUser({});
      return;
    }

    let cancelled = false;
    setLoadingPermissions(true);

    Promise.all(
      managed.map(async (user) => {
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
  }, [listUserAccessIds, managed, managedUserIds]);

  if (!allowed) return null;

  const toggleUserOpen = (userId: string, open: boolean) => {
    setOpenUserIds((current) =>
      open ? Array.from(new Set([...current, userId])) : current.filter((id) => id !== userId),
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
