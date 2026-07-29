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
  UserRound,
  MessageCircle,
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

const baseItems = [
  { title: "Acessos", url: "/departments", icon: FolderLock },
  { title: "Chat", url: "/chat", icon: MessageCircle },
  { title: "Seguranca", url: "/security", icon: KeyRound },
  { title: "Meu perfil", url: "/profile", icon: UserRound },
];

export function AppSidebar() {
  const { isAdmin, isCeo, canManagePermissions, logout } = useAuth();
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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-2 py-3">
        <div className="flex items-center gap-2.5 px-1.5 py-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[image:var(--gradient-vault)] text-primary-foreground shadow-[var(--shadow-glow)]">
            <Vault className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-display text-sm font-semibold">Maker Wallet</span>
            <span className="text-xs text-muted-foreground">Acessos seguros</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup className="px-0">
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent className="px-0">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className="h-10 rounded-xl data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                  >
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
          <SidebarGroup className="px-0">
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent className="px-0">
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                      className="h-10 rounded-xl data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                    >
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

      <SidebarFooter className="border-t border-sidebar-border px-2 py-3">
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
