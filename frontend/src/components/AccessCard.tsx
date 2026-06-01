import { useState } from "react";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PasswordField } from "@/components/PasswordField";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ACCESS_TYPE_LABELS,
  getAccessDepartmentIds,
  type AccessEntry,
  type Department,
} from "@/lib/mock-data";

interface AccessCardProps {
  access: AccessEntry;
  departments?: Department[];
  canManage?: boolean;
  onEdit?: (a: AccessEntry) => void;
  onDelete?: (id: string) => Promise<void>;
}

function Field({ label, value, link }: { label: string; value?: string; link?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {link ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {value} <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <span className="text-sm">{value}</span>
      )}
    </div>
  );
}

export function AccessCard({ access, departments = [], canManage, onEdit, onDelete }: AccessCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const accessDepartments = departments.filter((department) =>
    getAccessDepartmentIds(access).includes(department.id),
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold">{access.name}</h3>
          <Badge variant="secondary" className="mt-1">
            {ACCESS_TYPE_LABELS[access.type]}
          </Badge>
          {accessDepartments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {accessDepartments.map((department) => (
                <Badge key={department.id} variant="outline">
                  {department.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
        {canManage && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit?.(access)}
              aria-label="Editar"
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setConfirmOpen(true)}
              aria-label="Excluir"
            >
              <Trash2 className="text-destructive" />
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Aplicativo" value={access.appName} />
        <Field label="Rede" value={access.networkName} />
        <Field label="Host" value={access.host} />
        <Field label="Porta" value={access.port} />
        <Field label="Usuário" value={access.username} />
        <Field label="E-mail" value={access.email} />
        <Field label="Local" value={access.location} />
        <Field label="Arquivo Keystore" value={access.keystoreFile} />
        <Field label="ID" value={access.credentialId} />
        <Field label="Secret" value={access.credentialSecret} />
        <Field label="Token" value={access.credentialToken} />
        <Field label="Link de acesso" value={access.link} link />
      </div>

      <div className="mt-4">
        <span className="text-xs text-muted-foreground">Senha</span>
        <PasswordField accessId={access.id} password={access.password} className="mt-1" />
      </div>

      {access.notes && (
        <div className="mt-4 rounded-lg border border-border bg-background/40 p-3">
          <span className="text-xs text-muted-foreground">Observação</span>
          <p className="mt-0.5 text-sm">{access.notes}</p>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir acesso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O acesso “{access.name}” será removido
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (event) => {
                event.preventDefault();
                if (!onDelete || deleting) return;
                setDeleting(true);
                try {
                  await onDelete(access.id);
                  toast.success("Acesso excluido", { description: access.name });
                  setConfirmOpen(false);
                } catch {
                  toast.error("Nao foi possivel excluir o acesso");
                } finally {
                  setDeleting(false);
                }
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
