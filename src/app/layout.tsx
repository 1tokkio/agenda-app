import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import type { CSSProperties } from "react";
import "./globals.css";
import { config } from "@/lib/config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-app",
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
    <html lang="es" className={`${outfit.variable} ${inter.variable}`} style={themeVars} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-gray-50 font-outfit font-normal text-gray-800 antialiased dark:bg-gray-950 dark:text-white/90">
        {children}
      </body>
    </html>
  );
}
