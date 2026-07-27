import { useEffect, useRef, useState, type ReactNode } from "react";

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** Scroll-driven visual layer; React does not re-render on scroll. */
export function PremiumVaultScroll({ children }: { children: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(query.matches);
    updatePreference();
    query.addEventListener("change", updatePreference);
    return () => query.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reducedMotion) return;

    const updateScene = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        const bounds = section.getBoundingClientRect();
        const travel = Math.max(1, bounds.height - window.innerHeight);
        const progress = clamp(-bounds.top / travel);
        const openingProgress = clamp((progress - 0.12) / 0.72);
        const easedOpening = openingProgress * openingProgress * (3 - 2 * openingProgress);

        section.style.setProperty("--vault-progress", progress.toFixed(4));
        section.style.setProperty("--vault-rotate-y", `${-10 + progress * 22}deg`);
        section.style.setProperty("--vault-rotate-x", `${5 - progress * 10}deg`);
        section.style.setProperty("--vault-lift", `${progress * -42}px`);
        section.style.setProperty("--vault-scale", `${1 + progress * 0.13}`);
        section.style.setProperty("--lock-closed-opacity", `${1 - easedOpening}`);
        section.style.setProperty("--lock-open-opacity", `${easedOpening}`);
        section.style.setProperty("--lock-open-rise", `${(1 - easedOpening) * 18}px`);
        section.style.setProperty("--lock-open-scale", `${0.985 + easedOpening * 0.015}`);
        section.dataset.scene =
          progress < 0.34 ? "protect" : progress < 0.7 ? "organize" : "unlock";
      });
    };

    updateScene();
    window.addEventListener("scroll", updateScene, { passive: true });
    window.addEventListener("resize", updateScene, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateScene);
      window.removeEventListener("resize", updateScene);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      className="premium-vault-scroll"
      data-scene="protect"
      aria-label="Segurança Maker Wallet"
    >
      <div className="premium-vault-sticky">
        <div className="premium-vault-glow" aria-hidden="true" />
        <div className="premium-vault-grid" aria-hidden="true" />
        <div className="premium-vault-visual" aria-hidden="true">
          <div className="premium-vault-image-frame">
            <img
              src="/assets/images/maker-lock-closed.png"
              alt=""
              className="premium-vault-image premium-vault-image-closed"
            />
            <img
              src="/assets/images/maker-lock-open.png"
              alt=""
              className="premium-vault-image premium-vault-image-open"
            />
          </div>
        </div>
        <div className="premium-vault-copy" aria-live="polite">
          <p data-copy="protect">Proteção que começa antes do acesso.</p>
          <p data-copy="organize">Controle claro para credenciais críticas.</p>
          <p data-copy="unlock">Sua equipe, segura para avançar.</p>
        </div>
        <p className="premium-vault-scroll-hint" aria-hidden="true">
          role para explorar
        </p>
        {children}
      </div>
    </section>
  );
}
