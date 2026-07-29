import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Settings, UserRound } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { ROLE_LABELS } from "@/lib/mock-data";

export function UserMenu() {
  const { currentUser, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  if (!currentUser) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full outline-none ring-ring transition-transform hover:scale-105 focus-visible:ring-2"
          aria-label="Abrir menu do usuário"
        >
          <UserAvatar user={currentUser} className="h-9 w-9 border border-border" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-2xl border-border p-2" sideOffset={10}>
        <DropdownMenuLabel className="flex items-center gap-3 px-2 py-2">
          <UserAvatar user={currentUser} className="h-9 w-9" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{currentUser.name}</span>
            <span className="block truncate text-xs font-normal text-muted-foreground">
              {ROLE_LABELS[currentUser.role]}
            </span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile">
            <UserRound /> Meu perfil
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link to="/settings">
              <Settings /> Configurações
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          onSelect={() => {
            logout();
            navigate({ to: "/login" });
          }}
        >
          <LogOut /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
