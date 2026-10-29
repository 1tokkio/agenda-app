"use client";

import { usePathname } from "next/navigation";
import { MotionConfig } from "motion/react";
import { cn } from "@/lib/cn";
import { useSidebar, SidebarProvider } from "./SidebarContext";
import { ADMIN_NAV, Sidebar, isNavActive, type NavItem } from "./Sidebar";
import { Header, type HeaderUser } from "./Header";

type ShellProps = {
  eventName: string;
  brandSubtitle?: string;
  logoText?: string;
  children: React.ReactNode;
  navItems?: NavItem[];
  /** Título de la sección del menú (ORGANIZACIÓN, MENÚ…). */
  sectionTitle?: string;
  /** Primer tramo del breadcrumb del topbar. */
  rootLabel: string;
  /** Tarjeta al pie del menú (datos del evento o de ocupación). */
  footer?: React.ReactNode;
  showLogout?: boolean;
  user?: HeaderUser;
};

/** Shell de la app: menú lateral, topbar con breadcrumb y perfil, y contenido con el mismo espaciado en todas las vistas. */
export function AppShell(props: ShellProps) {
  return (
    <MotionConfig reducedMotion="user">
    <SidebarProvider>
      <ShellContent {...props} />
    </SidebarProvider>
    </MotionConfig>
  );
}

function ShellContent({
  eventName,
  brandSubtitle,
  logoText,
  children,
  navItems = ADMIN_NAV,
  sectionTitle,
  rootLabel,
  footer,
  showLogout = true,
  user,
}: ShellProps) {
  const { isExpanded, isMobile } = useSidebar();
  const pathname = usePathname();
  const currentLabel = navItems.find((item) => isNavActive(item, pathname))?.name ?? eventName;

  return (
    <div className="min-h-screen bg-bg text-text">
      <Sidebar
        eventName={eventName}
        brandSubtitle={brandSubtitle}
        logoText={logoText}
        items={navItems}
        sectionTitle={sectionTitle}
        footer={footer}
      />

      {isMobile && (
        <SidebarOverlay />
      )}

      <div className={cn("min-w-0 transition-[margin] duration-300 ease-in-out", !isMobile && (isExpanded ? "ms-[264px]" : "ms-[76px]"))}>
        <Header rootLabel={rootLabel} currentLabel={currentLabel} user={user} showLogout={showLogout} />
        <main className="px-5 pt-6 pb-12 md:px-10 md:pt-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarOverlay() {
  const { isMobileOpen, setIsMobileOpen } = useSidebar();
  if (!isMobileOpen) return null;
  return <div className="fixed inset-0 z-40 bg-gray-900/50" onClick={() => setIsMobileOpen(false)} aria-hidden="true" />;
}
