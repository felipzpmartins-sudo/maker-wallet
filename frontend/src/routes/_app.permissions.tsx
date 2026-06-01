import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useAdminGuard } from "@/hooks/use-admin-guard";
import { ROLE_LABELS } from "@/lib/mock-data";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { sortByName } from "@/lib/utils";

export const Route = createFileRoute("/_app/permissions")({
  component: PermissionsPage,
});

function PermissionsPage() {
  const allowed = useAdminGuard("permissions");
  const { users, departments, currentUser, isCeo, updateUser } = useAuth();
  const sortedDepartments = useMemo(() => sortByName(departments), [departments]);

  if (!allowed) return null;

  const managed = sortByName(
    users.filter((u) => {
      if (u.role === "ceo" || u.role === "pending") return false;
      if (!isCeo && u.id === currentUser?.id) return false;
      return u.role === "user" || u.role === "admin";
    }),
  );

  const toggleDept = (userId: string, deptId: string, current: string[]) => {
    const next = current.includes(deptId)
      ? current.filter((d) => d !== deptId)
      : [...current, deptId];
    updateUser(userId, { allowedDepartments: next });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Permissões</h1>
        <p className="text-sm text-muted-foreground">
          Libere quais departamentos cada usuário pode visualizar.
        </p>
      </div>

      {managed.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Nenhum usuário aprovado para gerenciar.
        </div>
      ) : (
        <div className="space-y-4">
          {managed.map((u) => {
            const total = u.role === "ceo" || !!u.totalAccess;
            return (
              <div key={u.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{ROLE_LABELS[u.role]}</Badge>
                    {isCeo && (
                      <label className="flex items-center gap-2 text-sm">
                        Acesso total
                        <Switch
                          checked={total}
                          onCheckedChange={(checked) => {
                            updateUser(u.id, {
                              totalAccess: checked,
                              allowedDepartments: checked ? sortedDepartments.map((d) => d.id) : [],
                            });
                            toast(checked ? "Acesso total liberado" : "Acesso total removido", {
                              description: u.name,
                            });
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {sortedDepartments.map((d) => {
                    const checked = total || u.allowedDepartments.includes(d.id);
                    return (
                      <label
                        key={d.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm"
                      >
                        <span>{d.name}</span>
                        <Switch
                          checked={checked}
                          disabled={total}
                          onCheckedChange={() => toggleDept(u.id, d.id, u.allowedDepartments)}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
