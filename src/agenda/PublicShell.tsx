"use client";

import { AppShell } from "@/components/admin/AppShell";
import type { NavItem } from "@/components/admin/Sidebar";
import { CalendarIcon, GridIcon } from "@/components/icons";
import { config } from "@/lib/config";

const AGENDA_NAV: NavItem = { name: "Agenda", href: "/", icon: <CalendarIcon className="size-6" />, exact: true };
const PANEL_NAV: NavItem = { name: "Panel", href: "/admin", icon: <GridIcon className="size-6" />, exact: true };

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
      navItems={isAdmin ? [AGENDA_NAV, PANEL_NAV] : [AGENDA_NAV]}
      subtitle="Agenda de reuniones"
      user={user}
    >
      {children}
    </AppShell>
  );
}
