"use client";

import { useState } from "react";
import { LogoutIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "./ThemeToggle";
import { useSidebar } from "./SidebarContext";

export type HeaderUser = { name: string; email: string };

type HeaderProps = {
  eventName: string;
  subtitle?: string;
  /** Usuario con sesión: muestra el botón de perfil. */
  user?: HeaderUser;
  /** Cierre de sesión por formulario POST (panel real). */
  showLogout?: boolean;
  /** Cierre de sesión como enlace (prototipo). Tiene prioridad sobre showLogout. */
  logoutHref?: string;
};

const LOGOUT_CLASS =
  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5";

export function Header({ eventName, subtitle = "Panel de organización", user, showLogout = true, logoutHref }: HeaderProps) {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const handleMenuToggle = () => {
    if (window.innerWidth >= 1280) toggleSidebar();
    else toggleMobileSidebar();
  };

  return (
    <header className="sticky top-0 z-99999 flex w-full border-gray-200 bg-white xl:border-b dark:border-gray-800 dark:bg-gray-900">
      <div className="flex grow flex-col items-center justify-between xl:flex-row xl:px-6">
        <div className="flex w-full items-center justify-between gap-2 border-b border-gray-200 px-3 py-3 sm:gap-4 xl:justify-normal xl:border-b-0 xl:px-0 xl:py-4 dark:border-gray-800">
          <button
            type="button"
            onClick={handleMenuToggle}
            aria-label="Mostrar u ocultar menú"
            className={cn(
              "z-99999 flex h-10 w-10 items-center justify-center rounded-lg border-gray-200 text-gray-500 lg:h-11 lg:w-11 xl:border dark:border-gray-800 dark:text-gray-400",
              isMobileOpen && "bg-gray-100 dark:bg-white/3",
            )}
          >
            <span className="flex flex-col gap-1.5">
              <span className="block h-0.5 w-4 bg-current" />
              <span className="block h-0.5 w-4 bg-current" />
              <span className="block h-0.5 w-4 bg-current" />
            </span>
          </button>

          <span className="truncate text-sm font-semibold text-gray-800 xl:hidden dark:text-white/90">{eventName}</span>

          <div className="hidden xl:block">
            <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-2 px-3 pb-3 sm:gap-4 sm:px-5 xl:justify-end xl:px-0 xl:pb-0">
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-2">
            {logoutHref ? (
              <a href={logoutHref} className={LOGOUT_CLASS} aria-label="Cerrar sesión">
                <LogoutIcon className="size-5" />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </a>
            ) : (
              showLogout && (
                <form action="/api/admin/logout" method="post">
                  <button type="submit" className={LOGOUT_CLASS} aria-label="Cerrar sesión">
                    <LogoutIcon className="size-5" />
                    <span className="hidden sm:inline">Cerrar sesión</span>
                  </button>
                </form>
              )
            )}
            {user && <UserMenu user={user} logoutHref={logoutHref} logoutPost={showLogout && !logoutHref} />}
          </div>
        </div>
      </div>
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

/** Botón de perfil con menú: datos de la cuenta y acceso a cerrar sesión. */
function UserMenu({ user, logoutHref, logoutPost }: { user: HeaderUser; logoutHref?: string; logoutPost?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-11 items-center gap-3 rounded-full border border-gray-200 py-1 pe-3 ps-1 text-start transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ background: "var(--app-primary)" }}
          aria-hidden="true"
        >
          {initials(user.name)}
        </span>
        <span className="hidden flex-col leading-tight sm:flex">
          <span className="text-sm font-medium text-gray-800 dark:text-white/90">{user.name}</span>
          {user.email && <span className="text-xs text-gray-500 dark:text-gray-400">{user.email}</span>}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-99998" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="menu"
            className="absolute end-0 top-full z-99999 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-2 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="px-3 py-2">
              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{user.name}</p>
              {user.email && <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>}
            </div>
            <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
            <button
              type="button"
              role="menuitem"
              className="w-full rounded-lg px-3 py-2 text-start text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              Mi perfil
            </button>
            {logoutHref && (
              <a
                role="menuitem"
                href={logoutHref}
                className="block w-full rounded-lg px-3 py-2 text-start text-sm text-error-600 hover:bg-gray-100 dark:text-error-500 dark:hover:bg-white/5"
              >
                Cerrar sesión
              </a>
            )}
            {logoutPost && (
              <form action="/api/admin/logout" method="post">
                <button
                  type="submit"
                  role="menuitem"
                  className="w-full rounded-lg px-3 py-2 text-start text-sm text-error-600 hover:bg-gray-100 dark:text-error-500 dark:hover:bg-white/5"
                >
                  Cerrar sesión
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
