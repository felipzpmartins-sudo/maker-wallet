import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, KeyRound, ShieldX, Vault } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, ApiError } from "@/lib/api";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Redefinir senha - Maker Wallet" },
      { name: "description", content: "Crie uma nova senha para sua conta." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Link de redefinicao invalido.");
      return;
    }

    if (password.length < 8) {
      setError("A senha deve ter ao menos 8 caracteres.");
      return;
    }

    if (password !== confirm) {
      setError("As senhas nao coincidem.");
      return;
    }

    setLoading(true);
    try {
      await apiRequest<{ passwordReset: boolean }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel redefinir a senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
            <Vault className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-semibold">Nova senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">Maker Wallet</p>
        </div>

        <div
          className="rounded-2xl border border-border p-6 shadow-[var(--shadow-elegant)]"
          style={{ background: "var(--gradient-vault)" }}
        >
          {!token ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <ShieldX className="h-12 w-12 text-warning" />
              <p className="text-sm text-muted-foreground">
                Este link de redefinicao esta incompleto. Solicite um novo link para continuar.
              </p>
              <Button asChild className="w-full" size="lg">
                <Link to="/forgot-password">Solicitar novo link</Link>
              </Button>
            </div>
          ) : done ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-primary" />
              <div>
                <h2 className="font-display text-lg font-semibold">Senha redefinida</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Agora voce ja pode acessar o Maker Wallet com a nova senha.
                </p>
              </div>
              <Button asChild className="w-full" size="lg">
                <Link to="/login">Entrar</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-background/60 p-3 text-sm text-muted-foreground">
                <KeyRound className="h-5 w-5 shrink-0 text-primary" />
                Crie uma senha com pelo menos 8 caracteres.
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar nova senha</Label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Salvando..." : "Salvar nova senha"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
