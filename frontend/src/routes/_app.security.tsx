import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import QRCode from "qrcode";
import {
  CheckCircle2,
  Copy,
  KeyRound,
  ScanLine,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { getVaultUnlockUntil, isVaultUnlocked, lockVault } from "@/lib/vault-unlock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfidentialBadge } from "@/components/ConfidentialBadge";

export const Route = createFileRoute("/_app/security")({
  component: SecurityPage,
});

type SetupState = {
  secret: string;
  otpauthUrl: string;
};

function SecurityPage() {
  const { currentUser, setupMfa, confirmMfa, disableMfa } = useAuth();
  const [setup, setSetup] = useState<SetupState | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [code, setCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [unlockUntil, setUnlockUntil] = useState(0);
  const mfaEnabled = !!currentUser?.mfaEnabled;

  useEffect(() => {
    if (!setup) {
      setQrDataUrl("");
      return;
    }

    QRCode.toDataURL(setup.otpauthUrl, {
      margin: 1,
      width: 220,
      color: {
        dark: "#111827",
        light: "#ffffff",
      },
    }).then(setQrDataUrl);
  }, [setup]);

  useEffect(() => {
    const syncUnlockState = () => setUnlockUntil(getVaultUnlockUntil());
    syncUnlockState();

    window.addEventListener("maker-wallet:vault-unlock-changed", syncUnlockState);
    const interval = window.setInterval(syncUnlockState, 1000);

    return () => {
      window.removeEventListener("maker-wallet:vault-unlock-changed", syncUnlockState);
      window.clearInterval(interval);
    };
  }, []);

  if (!currentUser) return null;

  const startSetup = async () => {
    setBusy(true);
    try {
      const result = await setupMfa();
      setSetup(result);
      setCode("");
    } catch (error) {
      console.error(error);
      toast.error("Nao foi possivel iniciar o iToken");
    } finally {
      setBusy(false);
    }
  };

  const confirmSetup = async () => {
    if (!/^\d{6}$/.test(code)) {
      toast.error("Codigo invalido", { description: "Digite os 6 numeros do autenticador." });
      return;
    }

    if (!setup) return;

    setBusy(true);
    try {
      await confirmMfa(code);
    } catch (error) {
      console.error(error);
      toast.error("Codigo incorreto", {
        description: "Confira o codigo atual no seu aplicativo autenticador.",
      });
      setBusy(false);
      return;
    }

    setSetup(null);
    setCode("");
    setBusy(false);
    toast.success("iToken ativado", {
      description: "Agora a exibicao de senhas exige codigo do autenticador.",
    });
  };

  const disable = async () => {
    if (!/^\d{6}$/.test(disableCode)) {
      toast.error("Codigo invalido", { description: "Digite os 6 numeros para desativar." });
      return;
    }

    setBusy(true);
    try {
      await disableMfa(disableCode);
    } catch (error) {
      console.error(error);
      toast.error("Codigo incorreto", {
        description: "Confira o codigo atual no seu aplicativo autenticador.",
      });
      setBusy(false);
      return;
    }

    setDisableCode("");
    setBusy(false);
    toast.success("iToken desativado");
  };

  const copy = async (value: string, message: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(message);
  };

  const vaultUnlocked = isVaultUnlocked();
  const unlockTime = unlockUntil
    ? new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(
        new Date(unlockUntil),
      )
    : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Protecao para revelar senhas do cofre</p>
          <h1 className="mt-1 font-display text-2xl font-semibold">Seguranca</h1>
        </div>
        <ConfidentialBadge />
      </div>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">iToken do usuario</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Use um aplicativo autenticador para gerar codigos rotativos. Esses codigos serao
                exigidos ao exibir ou copiar senhas.
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              mfaEnabled
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                : "border-amber-500/30 bg-amber-500/10 text-amber-600"
            }
          >
            {mfaEnabled ? (
              <>
                <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Ativo
              </>
            ) : (
              <>
                <ShieldOff className="mr-1 h-3.5 w-3.5" /> Nao configurado
              </>
            )}
          </Badge>
        </div>

        {!mfaEnabled && (
          <div className="mt-6 grid grid-cols-1 gap-5 rounded-xl border border-border bg-background/50 p-5 lg:grid-cols-[160px_1fr]">
            <div className="flex items-center justify-center rounded-lg bg-white p-4">
              <img
                src="/google-authenticator.jpg"
                alt="Google Authenticator"
                className="h-28 w-28 object-contain"
              />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold">Instale o Google Authenticator</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Antes de configurar o iToken, instale o aplicativo Google Authenticator no celular.
              </p>
              <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                <InstructionStep
                  icon={Smartphone}
                  title="1. Baixe o app"
                  text="Abra a loja do seu celular e procure por Google Authenticator."
                />
                <InstructionStep
                  icon={ScanLine}
                  title="2. Escaneie"
                  text="Toque para adicionar uma conta e escaneie o QR Code do Maker Wallet."
                />
                <InstructionStep
                  icon={CheckCircle2}
                  title="3. Confirme"
                  text="Digite o codigo de 6 digitos gerado no app para ativar o iToken."
                />
              </div>
            </div>
          </div>
        )}

        {!mfaEnabled && !setup && (
          <div className="mt-6">
            <Button onClick={startSetup} disabled={busy}>
              <ShieldCheck /> Configurar iToken
            </Button>
          </div>
        )}

        {!mfaEnabled && setup && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-background/50 p-5">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code do iToken" className="h-[220px] w-[220px]" />
              ) : (
                <div className="h-[220px] w-[220px] animate-pulse rounded-lg bg-muted" />
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-display text-base font-semibold">Cadastrar no autenticador</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Escaneie o QR Code no Google Authenticator, Authy ou Microsoft Authenticator.
                  Depois informe o codigo gerado para concluir.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Chave manual</Label>
                <div className="flex gap-2">
                  <Input readOnly value={setup.secret} className="font-mono text-xs" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copy(setup.secret, "Chave copiada")}
                    aria-label="Copiar chave"
                  >
                    <Copy />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Codigo do autenticador</Label>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void confirmSetup();
                  }}
                  placeholder="000000"
                  className="max-w-xs font-mono text-lg tracking-[0.35em]"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={confirmSetup} disabled={busy}>
                  <CheckCircle2 /> Ativar iToken
                </Button>
                <Button variant="outline" onClick={() => setSetup(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {mfaEnabled && (
          <div className="mt-6 space-y-4">
            <div
              className={`rounded-xl border p-4 ${
                vaultUnlocked
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-border bg-background/50"
              }`}
            >
              <h3 className="font-display text-base font-semibold">Cofre de senhas</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {vaultUnlocked
                  ? `Desbloqueado ate ${unlockTime}. Voce pode exibir/copiar senhas sem novo codigo.`
                  : "Bloqueado. Ao exibir a primeira senha, informe o codigo do autenticador para liberar por 1 minuto."}
              </p>
              {vaultUnlocked && (
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => {
                    lockVault();
                    toast.success("Cofre bloqueado");
                  }}
                >
                  Bloquear agora
                </Button>
              )}
            </div>

            <div className="rounded-xl border border-border bg-background/50 p-4">
              <h3 className="font-display text-base font-semibold">iToken ativo</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Para desativar, confirme com um codigo atual do autenticador.
              </p>
              <div className="mt-4 flex max-w-md flex-wrap gap-2">
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  value={disableCode}
                  onChange={(event) =>
                    setDisableCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  className="w-40 font-mono text-lg tracking-[0.35em]"
                />
                <Button variant="outline" onClick={disable} disabled={busy}>
                  Desativar
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function InstructionStep({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/70 p-4">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-relaxed">{text}</p>
    </div>
  );
}
