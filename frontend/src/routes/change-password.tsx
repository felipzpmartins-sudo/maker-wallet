import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound, Vault } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/change-password")({
  head: () => ({
    meta: [
      { title: "Criar nova senha - Maker Wallet" },
      { name: "description", content: "Troque sua senha temporaria para acessar o Maker Wallet." },
    ],
  }),
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const { currentUser, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate({ to: "/login" });
      return;
    }

    if (!currentUser.mustChangePassword) {
      navigate({ to: "/departments" });
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("A nova senha deve ter ao menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas nao coincidem.");
      return;
    }

    setLoading(true);
    const result = await changePassword(password);
    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "Nao foi possivel alterar a senha.");
      return;
    }

    navigate({ to: "/departments" });
  };

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
            <Vault className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-semibold">Crie sua nova senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">A senha temporaria deve ser trocada.</p>
        </div>

        <div
          className="rounded-2xl border border-border p-6 shadow-[var(--shadow-elegant)]"
          style={{ background: "var(--gradient-vault)" }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-background/60 p-3 text-sm text-muted-foreground">
              <KeyRound className="h-5 w-5 shrink-0 text-primary" />
              Defina uma senha definitiva para continuar acessando o sistema.
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Salvando..." : "Salvar nova senha"}
            </Button>

            <Button type="button" variant="ghost" className="w-full" onClick={logout}>
              Sair
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
