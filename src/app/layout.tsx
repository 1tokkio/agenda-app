import type { Metadata, Viewport } from "next";
import { Manrope, Outfit } from "next/font/google";
import type { CSSProperties } from "react";
import "./globals.css";
import { config } from "@/lib/config";

// Manrope para la interfaz y Outfit para títulos y cifras (tokens.css).
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--next-manrope",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--next-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: config.name,
  description: `Agendamiento de reuniones · ${config.name}`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Aplica el tema guardado antes del primer pintado para evitar parpadeo.
const themeScript = `try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { colors } = config.theme;

  // Colores del tema de config/event.ts, disponibles como variables CSS.
  const themeVars = {
    "--app-primary": colors.primary,
    "--app-secondary": colors.secondary,
    "--app-success": colors.success,
    "--app-danger": colors.danger,
  } as CSSProperties;

  return (
    <html lang="es" className={`${outfit.variable} ${manrope.variable}`} style={themeVars} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen font-normal antialiased">
        {children}
      </body>
    </html>
  );
}
