import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, ShieldCheck, Vault } from "lucide-react";
import { PremiumVaultScroll } from "@/components/login/PremiumVaultScroll";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import "@/components/login/premium-login.css";

type LoginStage = "idle" | "authenticating" | "opening";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Maker Wallet" },
      { name: "description", content: "Acesso restrito aos colaboradores autorizados da Maker." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loginStage, setLoginStage] = useState<LoginStage>("idle");
  const [loadingMessage, setLoadingMessage] = useState("Carregando seu banco de senhas");
  const isSubmitting = loginStage !== "idle";

  useEffect(() => {
    if (currentUser && loginStage === "idle")
      navigate({ to: currentUser.mustChangePassword ? "/change-password" : "/departments" });
  }, [currentUser, loginStage, navigate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");
    const nextErrors: { email?: string; password?: string } = {};

    if (!email.trim()) nextErrors.email = "Informe seu e-mail.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = "Informe um e-mail válido.";
    if (!password) nextErrors.password = "Informe sua senha.";

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const loadingTimers = [
      window.setTimeout(() => setLoadingMessage("Organizando seus acessos"), 1400),
      window.setTimeout(() => setLoadingMessage("Preparando seu ambiente seguro"), 2800),
    ];

    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    setLoadingMessage("Carregando seu banco de senhas");
    setLoginStage("authenticating");

    try {
      const result = await login(email.trim(), password);
      if (!result.ok) {
        setError(result.error ?? "Não foi possível entrar.");
        setLoginStage("idle");
        return;
      }

      loadingTimers.forEach((timer) => window.clearTimeout(timer));
      setLoadingMessage("Cofre liberado");
      setLoginStage("opening");
      await new Promise((resolve) => window.setTimeout(resolve, reducedMotion ? 120 : 900));
      navigate({ to: result.mustChangePassword ? "/change-password" : "/departments" });
    } catch {
      setError("Não foi possível conectar ao servidor.");
      setLoginStage("idle");
    } finally {
      loadingTimers.forEach((timer) => window.clearTimeout(timer));
    }
  };

  return (
    <main className="premium-login" data-auth-stage={loginStage} aria-busy={isSubmitting}>
      <PremiumVaultScroll>
        <div className="premium-login-topbar">
          <div className="premium-login-topbar-mark">
            <Vault className="h-4 w-4" aria-hidden="true" />
            Maker Wallet
          </div>
          <span>Ambiente de acesso restrito</span>
        </div>

        <div className="premium-login-content" aria-hidden={isSubmitting}>
          <div className="premium-login-form">
            <p className="premium-login-eyebrow">Portal seguro</p>
            <h1 className="premium-login-title">
              Sua equipe.
              <span>Suas chaves.</span>
            </h1>
            <p className="premium-login-description">
              Acesse as credenciais e serviços da Maker com rastreabilidade e controle em cada
              etapa.
            </p>

            <form
              onSubmit={handleSubmit}
              noValidate
              aria-busy={isSubmitting}
              className="premium-login-fields"
            >
              <div className="premium-login-field">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="voce@maker.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                    setFieldErrors((errors) => ({ ...errors, email: undefined }));
                  }}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? "email-error" : undefined}
                  required
                />
                {fieldErrors.email && (
                  <p id="email-error" className="premium-field-error">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="premium-login-field">
                <Label htmlFor="password">Senha</Label>
                <div className="premium-password-field">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                      setFieldErrors((errors) => ({ ...errors, password: undefined }));
                    }}
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? "password-error" : undefined}
                    required
                  />
                  <button
                    type="button"
                    className="premium-password-toggle"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p id="password-error" className="premium-field-error">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {error && (
                <p className="premium-login-api-error" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" className="premium-login-submit" disabled={isSubmitting}>
                {isSubmitting ? "Verificando acesso…" : "Entrar no Maker Wallet"}
              </Button>
            </form>

            <p className="premium-login-notice">
              Novas contas precisam de um link de convite enviado por um administrador.
            </p>
          </div>
        </div>

        {isSubmitting && (
          <div className="premium-login-loading" role="status" aria-live="polite">
            <div className="premium-login-loading-bar" aria-hidden="true">
              <span />
            </div>
            <p>{loadingMessage}</p>
            <span className="premium-login-loading-detail">
              {loginStage === "opening"
                ? "Acesso autorizado"
                : "Validando credenciais e preparando seus acessos"}
            </span>
          </div>
        )}

        <footer className="premium-login-footer">
          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          Acesso restrito aos colaboradores autorizados da Maker
        </footer>
      </PremiumVaultScroll>
    </main>
  );
}
