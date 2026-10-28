"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, GridIcon, GroupIcon, ListIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { useSidebar } from "./SidebarContext";

export type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
  /** Activo solo con la ruta exacta (por defecto activo también en subrutas). */
  exact?: boolean;
  external?: boolean;
};

export const ADMIN_NAV: NavItem[] = [
  { name: "Calendario", href: "/admin", icon: <GridIcon className="size-6" />, exact: true },
  { name: "Reuniones", href: "/admin/reuniones", icon: <ListIcon className="size-6" />, exact: true },
  { name: "Usuarios", href: "/admin/usuarios", icon: <GroupIcon className="size-6" />, exact: true },
  { name: "Agenda pública", href: "/", icon: <CalendarIcon className="size-6" />, exact: true },
];

export function Sidebar({
  eventName,
  brandSubtitle,
  logoText,
  items = ADMIN_NAV,
}: {
  eventName: string;
  brandSubtitle?: string;
  logoText?: string;
  items?: NavItem[];
}) {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, setIsMobileOpen } = useSidebar();
  const pathname = usePathname();
  const showLabels = isExpanded || isHovered || isMobileOpen;

  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));

  return (
    <aside
      className={cn(
        "fixed inset-s-0 top-0 z-50 flex h-screen flex-col border-e border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out xl:translate-x-0 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90",
        isExpanded || isMobileOpen || isHovered ? "w-72.5" : "w-22.5",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
      )}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cn("flex items-center gap-3 py-8", !showLabels && "xl:justify-center")}>
        <div
          className="app-logo flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
          style={{ background: "var(--app-primary)" }}
          aria-hidden="true"
        >
          {(logoText ?? eventName).slice(0, 2).toUpperCase()}
        </div>
        {showLabels && (
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-base font-semibold text-gray-800 dark:text-white/90">{eventName}</span>
            {brandSubtitle && (
              <span className="truncate text-[10px] font-normal tracking-[0.2em] text-gray-500 uppercase dark:text-gray-400">
                {brandSubtitle}
              </span>
            )}
          </span>
        )}
      </div>

      <nav className="no-scrollbar flex flex-col overflow-y-auto">
        <h2
          className={cn(
            "mb-4 flex text-xs leading-5 text-gray-400 uppercase",
            !showLabels ? "xl:justify-center" : "justify-start",
          )}
        >
          {showLabels ? "Menú" : "···"}
        </h2>
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const active = !item.external && isActive(item);
            const className = cn(
              "group menu-item",
              active ? "menu-item-active" : "menu-item-inactive",
              !showLabels && "xl:justify-center",
            );
            const content = (
              <>
                <span className={active ? "menu-item-icon-active" : "menu-item-icon-inactive"}>{item.icon}</span>
                {showLabels && <span className="menu-item-text">{item.name}</span>}
              </>
            );
            return (
              <li key={item.name}>
                {item.external ? (
                  <a href={item.href} className={className} onClick={() => setIsMobileOpen(false)}>
                    {content}
                  </a>
                ) : (
                  <Link href={item.href} className={className} onClick={() => setIsMobileOpen(false)}>
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
