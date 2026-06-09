import { useEffect, useState } from "react";
import { Check, Copy, Eye, EyeOff } from "lucide-react";
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
import { useAuth } from "@/lib/auth-context";
import { isVaultUnlocked, unlockVault } from "@/lib/vault-unlock";
import { cn } from "@/lib/utils";

interface PasswordFieldProps {
  accessId?: string;
  password: string;
  label?: string;
  className?: string;
}

export function PasswordField({ accessId, password, label = "Senha", className }: PasswordFieldProps) {
  const { currentUser, revealAccessPassword } = useAuth();
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [pendingAction, setPendingAction] = useState<"reveal" | "copy" | null>(null);
  const [revealedPassword, setRevealedPassword] = useState("");

  const displayPassword = revealedPassword || password;

  useEffect(() => {
    const hideWhenVaultLocks = () => {
      if (!isVaultUnlocked()) {
        setVisible(false);
        setRevealedPassword("");
      }
    };

    window.addEventListener("maker-wallet:vault-unlock-changed", hideWhenVaultLocks);

    return () => {
      window.removeEventListener("maker-wallet:vault-unlock-changed", hideWhenVaultLocks);
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(displayPassword);
    } catch {
      /* clipboard may be unavailable */
    }
    setCopied(true);
    toast.success("Copiado", { description: `${label} copiada para a area de transferencia.` });
    setTimeout(() => setCopied(false), 1800);
  };

  const requestUnlock = (action: "reveal" | "copy") => {
    if (visible && action === "reveal") {
      setVisible(false);
      return;
    }

    if (!currentUser?.mfaEnabled) {
      toast.error("iToken necessario", {
        description: "Ative o iToken em Seguranca para revelar ou copiar senhas.",
      });
      return;
    }

    if (isVaultUnlocked() && (!accessId || revealedPassword)) {
      if (action === "copy") {
        void copy();
      } else {
        setVisible(true);
      }
      return;
    }

    setPendingAction(action);
    setMfaCode("");
    setChallengeOpen(true);
  };

  const confirmUnlock = async () => {
    if (!/^\d{6}$/.test(mfaCode)) {
      toast.error("Codigo invalido", { description: "Digite os 6 numeros do autenticador." });
      return;
    }

    let unlockedPassword = displayPassword;

    if (!accessId) {
      toast.error("Senha indisponivel", {
        description: "Este acesso precisa estar sincronizado com a nuvem.",
      });
      return;
    }

    try {
      unlockedPassword = await revealAccessPassword(accessId, mfaCode);
      setRevealedPassword(unlockedPassword);
    } catch {
      toast.error("Codigo incorreto", {
        description: "Confira o codigo atual no seu aplicativo autenticador.",
      });
      return;
    }

    setChallengeOpen(false);
    unlockVault();

    if (pendingAction === "copy") {
      try {
        await navigator.clipboard.writeText(unlockedPassword);
      } catch {
        /* clipboard may be unavailable */
      }
      setCopied(true);
      toast.success("Copiado", { description: `${label} copiada para a area de transferencia.` });
      setTimeout(() => setCopied(false), 1800);
    } else {
      setVisible(true);
      toast.success("Cofre desbloqueado", {
        description: "Voce pode revelar senhas por 1 minuto sem informar novo codigo.",
      });
    }

    setPendingAction(null);
  };

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        <code className="flex-1 truncate rounded-md border border-border bg-background/60 px-3 py-2 font-mono text-sm tracking-wider">
          {visible ? displayPassword : "*".repeat(Math.min(displayPassword.length || 12, 14))}
        </code>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => requestUnlock("reveal")}
          aria-label={visible ? "Ocultar senha" : "Visualizar senha"}
        >
          {visible ? <EyeOff /> : <Eye />}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => requestUnlock("copy")}
          aria-label="Copiar senha"
        >
          {copied ? <Check className="text-primary" /> : <Copy />}
        </Button>
      </div>

      <Dialog open={challengeOpen} onOpenChange={setChallengeOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar iToken</DialogTitle>
            <DialogDescription>
              Digite o codigo de 6 digitos do autenticador para liberar esta senha.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Codigo</Label>
            <Input
              inputMode="numeric"
              maxLength={6}
              value={mfaCode}
              onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(event) => {
                if (event.key === "Enter") void confirmUnlock();
              }}
              placeholder="000000"
              className="font-mono text-lg tracking-[0.35em]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChallengeOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmUnlock}>Liberar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
