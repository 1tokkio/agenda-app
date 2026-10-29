"use client";

import { useState } from "react";
import { ProfileDialog } from "@/components/profile/ProfileDialog";
import { LogoutIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "./ThemeToggle";
import { useSidebar } from "./SidebarContext";

export type HeaderUser = { name: string; email: string };

type HeaderProps = {
  /** Primer tramo del breadcrumb, p. ej. "Expocorma 2026" o "Panel de organización". */
  rootLabel: string;
  /** Vista actual, último tramo del breadcrumb. */
  currentLabel: string;
  /** Usuario con sesión: muestra el botón de perfil. */
  user?: HeaderUser;
  showLogout?: boolean;
};

export function Header({ rootLabel, currentLabel, user, showLogout = true }: HeaderProps) {
  const { toggleSidebar, isMobile } = useSidebar();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-[68px] items-center gap-3 border-b border-border bg-surface px-4 md:px-8">
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={isMobile ? "Abrir menú" : "Mostrar u ocultar menú"}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-border text-text-2 transition-colors hover:bg-surface-2"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <nav aria-label="Ubicación" className="flex min-w-0 items-center gap-2 text-sm text-muted">
        <span className={cn("truncate", isMobile && "hidden")}>{rootLabel}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn("shrink-0", isMobile && "hidden")}>
          <path d="M9 6l6 6-6 6" />
        </svg>
        <span className="truncate font-medium text-text">{currentLabel}</span>
      </nav>

      <div className="flex-1" />

      <ThemeToggle />

      {user && (
        <>
          <div className="hidden h-7 w-px bg-border md:block" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            aria-label="Mi perfil"
            className="flex min-w-0 items-center gap-3 rounded-full py-1 ps-1 pe-3 text-start transition-colors hover:bg-surface-2"
          >
            <span
              className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-text"
              aria-hidden="true"
            >
              {initials(user.name)}
            </span>
            <span className="hidden min-w-0 flex-col leading-tight md:flex">
              <span className="truncate text-sm font-medium text-text">{user.name}</span>
              {user.email && <span className="truncate text-xs text-muted">{user.email}</span>}
            </span>
          </button>
        </>
      )}

      {showLogout && (
        <form action="/api/admin/logout" method="post">
          <button
            type="submit"
            aria-label="Cerrar sesión"
            className="flex h-10 items-center gap-2 rounded-[10px] border border-border px-3 text-sm font-medium whitespace-nowrap text-text-2 transition-colors hover:bg-surface-2"
          >
            <LogoutIcon className="size-4" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </form>
      )}

      {profileOpen && <ProfileDialog onClose={() => setProfileOpen(false)} />}
    </header>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
