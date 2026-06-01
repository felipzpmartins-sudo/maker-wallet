import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarClock,
  FolderLock,
  KeyRound,
  Users,
  ShieldCheck,
  Settings,
  LogOut,
  Vault,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";
import { ROLE_LABELS } from "@/lib/mock-data";

const baseItems = [
  { title: "Acessos", url: "/departments", icon: FolderLock },
  { title: "Seguranca", url: "/security", icon: KeyRound },
];

export function AppSidebar() {
  const { currentUser, isAdmin, isCeo, canManagePermissions, logout } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) => path === url || path.startsWith(url + "/");
  const menuItems = [
    ...baseItems,
    ...(isCeo ? [{ title: "Renovacoes", url: "/renewals", icon: CalendarClock }] : []),
  ];
  const adminItems = [
    ...(isAdmin ? [{ title: "Usuários", url: "/users", icon: Users }] : []),
    ...(canManagePermissions
      ? [{ title: "Permissões", url: "/permissions", icon: ShieldCheck }]
      : []),
    ...(isCeo ? [{ title: "Configurações", url: "/settings", icon: Settings }] : []),
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-1.5 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Vault className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-display text-sm font-semibold">Maker Wallet</span>
            <span className="text-xs text-muted-foreground">Acessos seguros</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-1.5 py-1.5 group-data-[collapsible=icon]:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold uppercase">
            {currentUser?.name.slice(0, 2)}
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-medium">{currentUser?.name}</span>
            <span className="text-xs text-primary">
              {currentUser ? ROLE_LABELS[currentUser.role] : ""}
            </span>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} tooltip="Sair">
              <LogOut />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
