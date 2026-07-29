import { useEffect, useRef } from "react";
import { ArrowRight, Check, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatWelcomeProps {
  onComplete: () => void;
  completing: boolean;
}

const benefits = [
  "Converse com usuários autorizados.",
  "Fale com a equipe administrativa.",
  "Solicite e acompanhe acessos.",
  "Compartilhe informações com mais segurança.",
];

export function ChatWelcome({ onComplete, completing }: ChatWelcomeProps) {
  const primaryActionRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    primaryActionRef.current?.focus();
  }, []);

  return (
    <section
      aria-labelledby="chat-welcome-title"
      className="relative mx-auto flex min-h-[calc(100vh-8rem)] max-w-[92rem] items-center overflow-hidden rounded-[1.75rem] border border-border bg-card/50 px-5 py-9 shadow-[var(--shadow-card)] sm:px-8 lg:min-h-[calc(100vh-10rem)] lg:px-12 lg:py-12"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-28 top-1/2 h-[34rem] w-[34rem] -translate-y-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-cyan-400/8 blur-3xl" />
        <div className="absolute right-[11%] top-[16%] h-2 w-2 rounded-full bg-primary/70 shadow-[0_0_28px_hsl(var(--primary))]" />
        <div className="absolute bottom-[19%] right-[38%] h-1.5 w-1.5 rounded-full bg-sky-200/75" />
      </div>

      <div className="relative grid w-full items-center gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(23rem,1.05fr)] lg:gap-12 xl:gap-20">
        <div className="order-2 max-w-xl motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 lg:order-1">
          <p className="text-sm font-semibold tracking-[0.16em] text-primary">
            CENTRAL DE CONVERSAS
          </p>
          <h1
            id="chat-welcome-title"
            className="mt-4 font-display text-4xl font-semibold leading-[1.06] tracking-tight text-foreground sm:text-5xl"
          >
            Conecte-se com sua equipe
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Converse com outros usuários, fale diretamente com a administração e solicite acesso a
            plataformas, sistemas e painéis de forma organizada e segura.
          </p>

          <ul
            className="mt-7 grid gap-2.5 sm:grid-cols-2"
            aria-label="Recursos da Central de Conversas"
          >
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-background/45 px-3 py-2.5 text-sm text-foreground/90"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                {benefit}
              </li>
            ))}
          </ul>

          <Button
            ref={primaryActionRef}
            type="button"
            size="lg"
            className="mt-8 w-full sm:w-auto"
            onClick={onComplete}
            disabled={completing}
          >
            {completing ? "Preparando seu chat..." : "Vamos lá"}
            {!completing && <ArrowRight />}
          </Button>

          <p className="mt-5 flex max-w-xl items-start gap-2.5 rounded-xl border border-warning/25 bg-warning/10 px-3.5 py-3 text-sm leading-5 text-foreground/85">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            Para sua proteção, nunca envie senhas ou credenciais diretamente nas mensagens.
          </p>
        </div>

        <div className="relative order-1 flex min-h-[18rem] items-center justify-center sm:min-h-[24rem] lg:order-2 lg:min-h-[31rem] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-5">
          <div className="absolute h-[78%] w-[78%] rounded-full bg-primary/25 blur-3xl" />
          <div className="absolute h-[71%] w-[71%] rounded-full border border-primary/15" />
          <div className="absolute h-[86%] w-[86%] rounded-full border border-primary/10" />
          <img
            src="/assets/images/chat-mascot.png"
            alt="Mascote da Central de Conversas da Maker Wallet"
            className="relative z-10 h-[min(78vw,25rem)] w-auto max-w-full object-contain drop-shadow-[0_2rem_3rem_rgba(16,102,255,0.26)] lg:h-[min(43vw,32.5rem)]"
          />
        </div>
      </div>
    </section>
  );
}
