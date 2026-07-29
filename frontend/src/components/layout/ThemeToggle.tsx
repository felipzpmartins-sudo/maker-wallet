import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "dark" | "light";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const savedTheme = window.localStorage.getItem("maker-wallet-theme");
  return savedTheme === "light" ? "light" : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem("maker-wallet-theme", theme);
  }, [theme]);

  const isDark = theme === "dark";
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Ativar tema ${isDark ? "claro" : "escuro"}`}
      title={`Ativar tema ${isDark ? "claro" : "escuro"}`}
    >
      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
      <span className="hidden sm:inline">{isDark ? "Tema claro" : "Tema escuro"}</span>
    </button>
  );
}
