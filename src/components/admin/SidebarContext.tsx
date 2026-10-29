"use client";

import { createContext, useContext, useEffect, useState } from "react";

type SidebarContextType = {
  /** Escritorio: 264 px con texto (true) o 76 px solo con íconos (false). */
  isExpanded: boolean;
  /** Móvil (menor de 768 px): el menú es un cajón que se abre sobre el contenido. */
  isMobile: boolean;
  isMobileOpen: boolean;
  /** Botón de menú del topbar: contrae o expande en escritorio, abre o cierra el cajón en móvil. */
  toggleSidebar: () => void;
  setIsMobileOpen: (open: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar debe usarse dentro de SidebarProvider");
  return context;
}

const MOBILE_BELOW = 768;
const EXPANDED_FROM = 1024;

/** Menú según el ancho: cajón bajo 768 px, solo íconos entre 768 y 1023 px, expandido desde 1024 px. */
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < MOBILE_BELOW);
      setIsExpanded(width >= EXPANDED_FROM);
      if (width >= MOBILE_BELOW) setIsMobileOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isExpanded,
        isMobile,
        isMobileOpen,
        toggleSidebar: () => {
          if (isMobile) setIsMobileOpen((open) => !open);
          else setIsExpanded((expanded) => !expanded);
        },
        setIsMobileOpen,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
