import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";

interface AccessPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessName: string;
  onSave: (password: string) => Promise<void>;
}

export function AccessPasswordDialog({
  open,
  onOpenChange,
  accessName,
  onSave,
}: AccessPasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword("");
      setConfirmation("");
      setVisible(false);
    }
  }, [open]);

  const submit = async () => {
    if (saving) return;

    if (!password.trim()) {
      toast.error("Informe a nova senha");
      return;
    }

    if (password !== confirmation) {
      toast.error("As senhas nao conferem", {
        description: "Digite o mesmo valor nos dois campos.",
      });
      return;
    }

    setSaving(true);
    try {
      await onSave(password);
      toast.success("Senha atualizada", { description: accessName });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      const description = error instanceof ApiError ? error.message : undefined;
      toast.error("Nao foi possivel alterar a senha", { description });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Alterar senha do acesso</DialogTitle>
          <DialogDescription>
            A nova senha substitui a atual de “{accessName}” para todos que usam este acesso.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nova senha</Label>
            <div className="flex items-center gap-2">
              <Input
                type={visible ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setVisible((current) => !current)}
                aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
              >
                {visible ? <EyeOff /> : <Eye />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Confirmar nova senha</Label>
            <Input
              type={visible ? "text" : "password"}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void submit();
              }}
              autoComplete="new-password"
              className="font-mono"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Salvando..." : "Salvar senha"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
