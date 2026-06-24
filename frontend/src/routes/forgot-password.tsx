import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, KeyRound, Vault } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, ApiError } from "@/lib/api";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Esqueci minha senha - Maker Wallet" },
      { name: "description", content: "Solicite um link de redefinicao de senha." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiRequest<{ sent: boolean }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel solicitar a redefinicao.");
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
          <h1 className="font-display text-2xl font-semibold">Recuperar senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">Maker Wallet</p>
        </div>

        <div
          className="rounded-2xl border border-border p-6 shadow-[var(--shadow-elegant)]"
          style={{ background: "var(--gradient-vault)" }}
        >
          {done ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-primary" />
              <div>
                <h2 className="font-display text-lg font-semibold">Verifique seu e-mail</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Se este e-mail estiver cadastrado, enviaremos um link para criar uma nova senha.
                </p>
              </div>
              <Button asChild className="w-full" size="lg">
                <Link to="/login">Voltar ao login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-background/60 p-3 text-sm text-muted-foreground">
                <KeyRound className="h-5 w-5 shrink-0 text-primary" />
                Informe o e-mail da conta para receber o link de redefinicao.
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link"}
              </Button>

              <Button asChild variant="ghost" className="w-full">
                <Link to="/login">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao login
                </Link>
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
