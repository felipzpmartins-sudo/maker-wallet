import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/sso")({ component: WalletSso });

function WalletSso() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [message, setMessage] = useState("Validando seu acesso único…");

  const returnToHub = () => {
    window.location.replace(import.meta.env.VITE_MKR_HUB_URL?.trim() || "http://localhost:3000/dashboard");
  };

  useEffect(() => {
    const ticket = new URLSearchParams(window.location.search).get("ticket");
    const exchangeUrl = import.meta.env.VITE_MKR_HUB_SSO_EXCHANGE_URL;
    if (!ticket || !exchangeUrl) {
      setMessage("Acesso único indisponível. Voltando para o MKR HUB…");
      returnToHub();
      return;
    }

    let active = true;
    void (async () => {
      try {
        const response = await fetch(exchangeUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticket }),
        });
        const payload: unknown = await response.json().catch(() => null);
        const accessToken =
          payload && typeof payload === "object" && typeof (payload as { accessToken?: unknown }).accessToken === "string"
            ? (payload as { accessToken: string }).accessToken
            : null;
        if (!response.ok || !accessToken) throw new Error("sso_exchange_failed");

        const result = await loginWithToken(accessToken);
        if (!result.ok) throw new Error("wallet_session_failed");
        if (active) navigate({ to: result.mustChangePassword ? "/change-password" : "/departments" });
      } catch {
        if (active) {
          setMessage("Não foi possível concluir o acesso único. Voltando para o MKR HUB…");
          returnToHub();
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [loginWithToken, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <section className="max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-xl">
        <p className="text-sm font-medium tracking-[0.18em] text-primary">MKR MAKER WALLET</p>
        <h1 className="mt-3 text-2xl font-semibold">Acesso ao cofre</h1>
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      </section>
    </main>
  );
}
