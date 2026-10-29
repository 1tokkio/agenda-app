"use client";

import { AppShell } from "@/components/admin/AppShell";
import type { NavItem } from "@/components/admin/Sidebar";
import { CalendarIcon, GridIcon } from "@/components/icons";
import { config } from "@/lib/config";
import { SidebarFooter } from "./SidebarFooter";

const AGENDA_NAV: NavItem = { name: "Agenda", href: "/", icon: <CalendarIcon className="size-5" />, exact: true };
const PANEL_NAV: NavItem = { name: "Panel", href: "/admin", icon: <GridIcon className="size-5" />, exact: true };

/** Shell de la agenda para usuarios con sesión. Los administradores también ven el acceso al panel. */
export function PublicShell({
  children,
  user,
  isAdmin,
}: {
  children: React.ReactNode;
  user: { name: string; email: string };
  isAdmin: boolean;
}) {
  return (
    <AppShell
      eventName={config.name}
      brandSubtitle={config.subtitle}
      logoText={config.logoText}
      rootLabel={config.subtitle}
      navItems={isAdmin ? [AGENDA_NAV, PANEL_NAV] : [AGENDA_NAV]}
      sectionTitle="Menú"
      footer={<SidebarFooter variant="user" />}
      user={user}
    >
      {children}
    </AppShell>
  );
}
