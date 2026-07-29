import { useRouterState } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";

const pageTitles: Record<string, string> = {
  "/departments": "Acessos",
  "/security": "Segurança",
  "/renewals": "Renovações",
  "/users": "Usuários",
  "/permissions": "Permissões",
  "/settings": "Configurações",
  "/profile": "Meu perfil",
  "/chat": "Chat",
};

export function AppHeader() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const title = path.startsWith("/departments/") ? "Acessos" : pageTitles[path] ?? "Maker Wallet";

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-background/82 px-4 backdrop-blur-xl sm:px-6">
      <SidebarTrigger aria-label="Alternar menu" />
      <div>
        <span className="font-display text-sm font-semibold tracking-tight">{title}</span>
        <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">Central Maker Wallet</span>
      </div>
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
