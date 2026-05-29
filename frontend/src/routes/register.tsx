import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Vault, CheckCircle2, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { isValidRegistrationInvite } from "@/lib/invite";

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>) => ({
    invite: typeof search.invite === "string" ? search.invite : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Criar conta — Maker Wallet" },
      { name: "description", content: "Cadastre-se para solicitar acesso ao Maker Wallet." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { register } = useAuth();
  const { invite } = Route.useSearch();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const inviteIsValid = isValidRegistrationInvite(invite);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    const res = register(name.trim(), email.trim(), password);
    if (!res.ok) {
      setError(res.error ?? "Não foi possível criar a conta.");
      return;
    }
    setDone(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
            <Vault className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-semibold">Criar nova conta</h1>
          <p className="mt-1 text-sm text-muted-foreground">Maker Wallet</p>
        </div>
        <div
          className="rounded-2xl border border-border p-6 shadow-[var(--shadow-elegant)]"
          style={{ background: "var(--gradient-vault)" }}
        >
          {!inviteIsValid ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <ShieldX className="h-12 w-12 text-warning" />
              <div>
                <h2 className="font-display text-lg font-semibold">Convite inválido</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  O cadastro só pode ser feito por um link de convite enviado por um administrador.
                </p>
              </div>
              <Button asChild className="w-full" size="lg">
                <Link to="/login">Voltar ao login</Link>
              </Button>
            </div>
          ) : done ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-primary" />
              <p className="text-sm text-foreground">
                Sua conta foi criada e está aguardando liberação de acesso por um administrador.
              </p>
              <Button asChild className="w-full" size="lg">
                <Link to="/login">Voltar ao login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar senha</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" size="lg">
                Criar conta
              </Button>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">Já tem conta? </span>
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Entrar
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
