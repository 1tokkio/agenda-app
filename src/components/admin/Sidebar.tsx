"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAgenda } from "@/agenda/store";
import { CalendarIcon, GridIcon, GroupIcon, ListIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { useSidebar } from "./SidebarContext";

export type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
  /** Activo solo con la ruta exacta (por defecto activo también en subrutas). */
  exact?: boolean;
  /** Enlace a otra vista de la app (muestra la flecha de enlace externo). */
  external?: boolean;
  /** Muestra un contador con las reuniones agendadas. */
  count?: "meetings";
};

export const ADMIN_NAV: NavItem[] = [
  { name: "Calendario", href: "/admin", icon: <GridIcon className="size-5" />, exact: true },
  { name: "Reuniones", href: "/admin/reuniones", icon: <ListIcon className="size-5" />, exact: true, count: "meetings" },
  { name: "Usuarios", href: "/admin/usuarios", icon: <GroupIcon className="size-5" />, exact: true },
  { name: "Agenda pública", href: "/", icon: <CalendarIcon className="size-5" />, exact: true, external: true },
];

/** Ruta activa: la coincidencia exacta, o el prefijo para el resto de los ítems. */
export function isNavActive(item: NavItem, pathname: string): boolean {
  if (item.external) return false;
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export function Sidebar({
  eventName,
  brandSubtitle,
  logoText,
  items = ADMIN_NAV,
  sectionTitle = "Menú",
  footer,
}: {
  eventName: string;
  brandSubtitle?: string;
  logoText?: string;
  items?: NavItem[];
  sectionTitle?: string;
  footer?: React.ReactNode;
}) {
  const { isExpanded, isMobile, isMobileOpen, setIsMobileOpen } = useSidebar();
  const pathname = usePathname();
  const { meetings } = useAgenda();
  const showLabels = isMobile || isExpanded;

  return (
    <aside
      aria-label="Navegación principal"
      className={cn(
        "fixed inset-y-0 start-0 z-50 flex h-screen flex-col gap-7 overflow-y-auto border-e border-border bg-surface px-3.5 py-5 text-text transition-[width,transform] duration-300 ease-in-out",
        isMobile ? "w-[300px]" : isExpanded ? "w-[264px]" : "w-[76px]",
        isMobile && !isMobileOpen && "-translate-x-full",
      )}
    >
      <div className={cn("flex min-h-10 items-center gap-3 px-1", !showLabels && "justify-center")}>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] text-sm font-semibold text-white"
          style={{ background: "var(--logo)" }}
          aria-hidden="true"
        >
          {(logoText ?? eventName).slice(0, 2).toUpperCase()}
        </div>
        {showLabels && (
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[17px] font-medium text-text" style={{ fontFamily: "var(--font-display)" }}>
              {eventName}
            </span>
            {brandSubtitle && (
              <span className="truncate text-[11px] font-medium tracking-[0.12em] text-muted">{brandSubtitle}</span>
            )}
          </span>
        )}
      </div>

      <nav className="flex flex-col gap-1">
        {showLabels && (
          <span className="px-3 pb-1.5 text-[11px] font-medium tracking-[0.08em] text-muted uppercase">{sectionTitle}</span>
        )}
        {items.map((item) => {
          const active = isNavActive(item, pathname);
          const count = item.count === "meetings" ? meetings.length : null;
          const linkClass = cn(
            "flex h-[42px] w-full items-center gap-3 rounded-[10px] px-3 text-sm font-medium transition-colors",
            active ? "bg-brand-soft text-brand-text" : "text-text-2 hover:bg-surface-2",
            !showLabels && "justify-center",
          );
          const content = (
            <>
              <span className="shrink-0" aria-hidden="true">
                {item.icon}
              </span>
              {showLabels && <span className="min-w-0 flex-1 truncate">{item.name}</span>}
              {showLabels && count !== null && <span className="text-xs text-muted tabular-nums">{count}</span>}
              {showLabels && item.external && <ExternalIcon />}
            </>
          );
          return (
            <Link
              key={item.name}
              href={item.href}
              className={linkClass}
              aria-label={showLabels ? undefined : item.name}
              aria-current={active ? "page" : undefined}
              onClick={() => setIsMobileOpen(false)}
            >
              {content}
            </Link>
          );
        })}
      </nav>

      {showLabels && <div className="mt-auto">{footer}</div>}
    </aside>
  );
}

function ExternalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}
