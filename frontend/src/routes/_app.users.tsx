import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useAdminGuard } from "@/hooks/use-admin-guard";
import { ROLE_LABELS, type UserRole } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Ban, KeyRound, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/users")({
  component: UsersPage,
});

const roleStyles: Record<UserRole, string> = {
  ceo: "bg-primary/15 text-primary border-primary/30",
  admin: "bg-primary/15 text-primary border-primary/30",
  user: "bg-secondary text-secondary-foreground border-border",
  pending: "bg-warning/15 text-warning border-warning/30",
};

function UsersPage() {
  const allowed = useAdminGuard();
  const { users, currentUser, isCeo, updateUser, deleteUser, resetUserMfa } = useAuth();

  if (!allowed) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Usuários</h1>
        <p className="text-sm text-muted-foreground">
          Aprove novos colaboradores. Somente o CEO altera cargos e permissões administrativas.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="divide-y divide-border">
          {users.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold uppercase">
                {u.name.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{u.name}</p>
                <p className="truncate text-sm text-muted-foreground">{u.email}</p>
              </div>

              <Badge variant="outline" className={roleStyles[u.role]}>
                {ROLE_LABELS[u.role]}
              </Badge>

              <div className="flex items-center gap-2">
                {u.role === "pending" ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      updateUser(u.id, { role: "user" });
                      toast.success("Usuário aprovado", { description: u.name });
                    }}
                  >
                    <CheckCircle2 /> Aprovar
                  </Button>
                ) : (
                  isCeo &&
                  u.id !== currentUser?.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        updateUser(u.id, {
                          role: "pending",
                          allowedDepartments: [],
                          totalAccess: false,
                          canManagePermissions: false,
                        });
                        toast("Usuário bloqueado", { description: u.name });
                      }}
                    >
                      <Ban /> Bloquear
                    </Button>
                  )
                )}

                {isCeo && u.id !== currentUser?.id && u.role !== "pending" && (
                  <>
                    <Select
                      value={u.role}
                      onValueChange={(v) =>
                        updateUser(u.id, {
                          role: v as UserRole,
                          canManagePermissions: v === "admin" ? u.canManagePermissions : false,
                        })
                      }
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuário comum</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="ceo">CEO</SelectItem>
                      </SelectContent>
                    </Select>

                    {u.role === "admin" && (
                      <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                        Pode liberar áreas
                        <Switch
                          checked={!!u.canManagePermissions}
                          onCheckedChange={(checked) => {
                            updateUser(u.id, { canManagePermissions: checked });
                            toast(
                              checked
                                ? "Permissão administrativa liberada"
                                : "Permissão administrativa removida",
                              { description: u.name },
                            );
                          }}
                        />
                      </label>
                    )}
                  </>
                )}

                {isCeo && u.id !== currentUser?.id && (
                  <div className="flex items-center gap-1 rounded-md border border-border px-2 py-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        resetUserMfa(u.id);
                        toast.success("iToken resetado", {
                          description: `${u.name} precisara configurar um novo iToken.`,
                        });
                      }}
                    >
                      <KeyRound /> Resetar iToken
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-destructive">
                          <Trash2 /> Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir usuario?</AlertDialogTitle>
                          <AlertDialogDescription>
                            O usuario "{u.name}" sera removido do sistema. Esta acao nao pode ser
                            desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              deleteUser(u.id);
                              toast.success("Usuario excluido", { description: u.name });
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir usuario
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
