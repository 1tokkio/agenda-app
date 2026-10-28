"use client";

import { AppShell } from "@/components/admin/AppShell";
import type { NavItem } from "@/components/admin/Sidebar";
import { CalendarIcon } from "@/components/icons";
import { config } from "@/lib/config";

const PUBLIC_NAV: NavItem[] = [{ name: "Agenda", href: "/", icon: <CalendarIcon className="size-6" />, exact: true }];

/** Shell de la agenda pública (tótem y dispositivos de visitantes): sin acceso al panel ni cuenta. */
export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      eventName={config.name}
      brandSubtitle={config.subtitle}
      logoText={config.logoText}
      navItems={PUBLIC_NAV}
      subtitle="Agenda de reuniones"
      showLogout={false}
    >
      {children}
    </AppShell>
  );
}
