"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "@/components/icons";

// El estado vive en la clase "dark" de <html>; se lee y se observa sin efectos.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const isDark = () => document.documentElement.classList.contains("dark");
const isDarkOnServer = () => false;

/** Alterna modo claro/oscuro. La preferencia queda solo en este navegador. */
export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, isDarkOnServer);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Sin acceso a localStorage (modo privado): solo cambia en esta sesión.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Cambiar tema"
      className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
    >
      {dark ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}
    </button>
  );
}
