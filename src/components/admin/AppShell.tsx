"use client";

import { cn } from "@/lib/cn";
import { useSidebar, SidebarProvider } from "./SidebarContext";
import { ADMIN_NAV, Sidebar, type NavItem } from "./Sidebar";
import { Header, type HeaderUser } from "./Header";

type ShellProps = {
  eventName: string;
  brandSubtitle?: string;
  logoText?: string;
  children: React.ReactNode;
  navItems?: NavItem[];
  subtitle?: string;
  showLogout?: boolean;
  user?: HeaderUser;
  logoutHref?: string;
};

/** Shell del panel: menú lateral, encabezado y contenido. Mismo esquema que AppLayout del template. */
export function AppShell({ eventName, brandSubtitle, logoText, children, navItems = ADMIN_NAV, subtitle, showLogout = true, user, logoutHref }: ShellProps) {
  return (
    <SidebarProvider>
      <ShellContent eventName={eventName} brandSubtitle={brandSubtitle} logoText={logoText} navItems={navItems} subtitle={subtitle} showLogout={showLogout} user={user} logoutHref={logoutHref}>
        {children}
      </ShellContent>
    </SidebarProvider>
  );
}

function ShellContent({ eventName, brandSubtitle, logoText, children, navItems, subtitle, showLogout, user, logoutHref }: ShellProps & { navItems: NavItem[] }) {
  const { isExpanded, isHovered, isMobileOpen, setIsMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen xl:flex">
      <Sidebar eventName={eventName} brandSubtitle={brandSubtitle} logoText={logoText} items={navItems} />

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 xl:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "min-w-0 flex-1 transition-[margin] duration-300 ease-in-out",
          isExpanded || isHovered ? "xl:ms-72.5" : "xl:ms-22.5",
        )}
      >
        <Header eventName={eventName} subtitle={subtitle} showLogout={showLogout} user={user} logoutHref={logoutHref} />
        <main className="mx-auto w-full max-w-(--breakpoint-2xl) p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
