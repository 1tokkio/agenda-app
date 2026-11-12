"use client";

import Link from "next/link";
import { motion, MotionConfig } from "motion/react";
import { config } from "@/lib/config";
import { ROOM_NAME, SLOT_MINUTES } from "./data";
import { formatDayShort } from "./logic";

// Azul de la bandera de Finlandia (el mismo color primario del tema). La página es siempre clara: la bandera es blanca y azul.
const BLUE = "var(--app-primary, #003580)";
const INK = "#0f172a";
const MUTED = "#64748b";

const FIRST_DAY = config.schedule.days[0];
const LAST_DAY = config.schedule.days[config.schedule.days.length - 1];

/** "18 – 20 nov 2026". */
function eventDates(): string {
  const day = (date: string) => Number(date.slice(8, 10));
  const month = formatDayShort(LAST_DAY.date).split(" ").slice(-1)[0].replace(".", "");
  return `${day(FIRST_DAY.date)} – ${day(LAST_DAY.date)} ${month} ${LAST_DAY.date.slice(0, 4)}`;
}

/**
 * Página de inicio, antes del ingreso: la bandera de Finlandia como protagonista, los datos del evento y
 * un único botón para entrar. La cruz de la bandera se dibuja al cargar (y queda quieta si el sistema pide menos movimiento).
 */
export function Landing() {
  const facts: [string, string][] = [
    ["Fechas", eventDates()],
    ["Horario", `${FIRST_DAY.start} – ${FIRST_DAY.end}`],
    ["Reuniones", `${SLOT_MINUTES} minutos`],
    ["Lugar", ROOM_NAME],
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col bg-white" style={{ color: INK }}>
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
          <div className="flex items-center gap-3">
            <Flag className="h-6 w-auto" animate={false} />
            <span className="text-[15px] font-semibold tracking-tight">{config.name}</span>
          </div>
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded-[10px] border px-4 text-sm font-semibold transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ borderColor: BLUE, color: BLUE, outlineColor: BLUE }}
          >
            Ingresar
          </Link>
        </header>

        <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-6 pb-12 sm:px-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <div className="order-last flex flex-col gap-7 lg:order-first">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-xs font-semibold tracking-[0.18em]"
              style={{ color: BLUE }}
            >
              {config.subtitle.toUpperCase()}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-[40px] leading-[1.05] font-normal tracking-tight sm:text-[54px] lg:text-[60px]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Agenda de reuniones del stand de Finlandia
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.75 }}
              className="max-w-md text-base leading-relaxed sm:text-lg"
              style={{ color: MUTED }}
            >
              Reserva reuniones de {SLOT_MINUTES} minutos con las empresas del stand durante los tres días del evento.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5"
            >
              <Link
                href="/login"
                className="inline-flex h-12 items-center gap-2 rounded-[12px] px-7 text-[15px] font-semibold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ background: BLUE, outlineColor: BLUE }}
              >
                Ingresar a la agenda
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <span className="text-sm" style={{ color: MUTED }}>
                Acceso para el equipo del stand
              </span>
            </motion.div>
          </div>

          <div className="order-first lg:order-last">
            <Flag className="mx-auto w-full max-w-[560px] drop-shadow-[0_24px_48px_rgba(0,53,128,0.18)]" animate />
          </div>
        </main>

        <footer className="mx-auto w-full max-w-6xl px-6 pb-8 sm:px-10">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-t pt-6 sm:grid-cols-4" style={{ borderColor: BLUE }}>
            {facts.map(([label, value]) => (
              <div key={label} className="flex flex-col gap-1">
                <dt className="text-[11px] font-semibold tracking-[0.12em] uppercase" style={{ color: MUTED }}>
                  {label}
                </dt>
                {/* Guion sin salto de línea: "2-C06" no se parte en dos renglones en celular. */}
                <dd className="text-[15px] font-medium">{value.replaceAll("-", "\u2011")}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-xs tracking-wide" style={{ color: MUTED }}>
            {config.companies.map((c) => c.name).join("  ·  ")}
          </p>
        </footer>
      </div>
    </MotionConfig>
  );
}

/**
 * Bandera de Finlandia: fondo blanco y cruz nórdica azul (proporción 18:11, cruz de 3 de ancho). Con `animate`,
 * primero baja la barra vertical y después cruza la horizontal.
 */
function Flag({ className, animate }: { className?: string; animate: boolean }) {
  const grow = (axis: "x" | "y", delay: number) =>
    animate
      ? {
          initial: axis === "y" ? { scaleY: 0 } : { scaleX: 0 },
          animate: axis === "y" ? { scaleY: 1 } : { scaleX: 1 },
          transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
          style: { transformBox: "fill-box" as const, transformOrigin: axis === "y" ? "top" : "left" },
        }
      : {};

  return (
    <svg viewBox="0 0 18 11" role="img" aria-label="Bandera de Finlandia" className={className}>
      <rect width="18" height="11" rx="0.45" fill="#ffffff" />
      <rect x="0.12" y="0.12" width="17.76" height="10.76" rx="0.38" fill="none" stroke={BLUE} strokeWidth="0.24" />
      <motion.rect x="5" y="0.12" width="3" height="10.76" fill={BLUE} {...grow("y", 0.1)} />
      <motion.rect x="0.12" y="4" width="17.76" height="3" fill={BLUE} {...grow("x", 0.45)} />
    </svg>
  );
}
