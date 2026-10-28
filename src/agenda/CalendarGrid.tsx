"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { DAYS, SLOT_TIMES, companyById } from "./data";
import { formatDayShort } from "./logic";
import { useAgenda, type SlotState } from "./store";

type Props = {
  mode: "public" | "admin";
  /** Ajusta el calendario al alto de la ventana (tablet y escritorio). En celular la altura es natural. */
  fit?: boolean;
  onSlotClick: (date: string, time: string, state: SlotState) => void;
};

// Alturas mínimas por bloque en modo ajustado: 34 px por bloque y 40 px de encabezado.
const FIT_SLOT_PX = 34;
const FIT_HEADER_PX = 40;
const BOTTOM_GAP_PX = 24;

/**
 * Calendario central, estilo cuadrícula semanal: tres días en columnas y bloques de 30 min (10:00–19:00).
 * En escritorio y tablet se ven los tres días; en celular, un día a la vez.
 * Con `fit`, el calendario ocupa el alto restante de la ventana sin scroll vertical.
 */
export function CalendarGrid({ mode, fit = false, onSlotClick }: Props) {
  const { slotState } = useAgenda();
  const [activeDay, setActiveDay] = useState<string>(DAYS[0]);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Ajusta la altura del calendario al espacio libre bajo su posición actual.
  useEffect(() => {
    if (!fit) return;
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      if (window.innerWidth < 768) {
        el.style.height = "";
        return;
      }
      const top = el.getBoundingClientRect().top;
      const minHeight = SLOT_TIMES.length * FIT_SLOT_PX + FIT_HEADER_PX;
      el.style.height = `${Math.max(window.innerHeight - top - BOTTOM_GAP_PX, minHeight)}px`;
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [fit]);

  return (
    <div className="flex flex-col gap-4">
      {/* Selector de día para celular */}
      <div className="grid grid-cols-3 gap-2 md:hidden" role="tablist" aria-label="Días del evento">
        {DAYS.map((day) => (
          <button
            key={day}
            type="button"
            role="tab"
            aria-selected={day === activeDay}
            onClick={() => setActiveDay(day)}
            className={cn(
              "min-h-14 rounded-xl px-2 text-base font-semibold capitalize transition",
              day === activeDay
                ? "bg-brand-500 text-white shadow-theme-xs"
                : "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700",
            )}
          >
            {formatDayShort(day)}
          </button>
        ))}
      </div>

      <div
        ref={wrapRef}
        className={cn(
          "flex overflow-hidden rounded-xl border border-gray-300 bg-white dark:border-gray-800 dark:bg-gray-900",
          fit && "md:min-h-0",
        )}
      >
        {/* Columna de horas */}
        <div className="flex w-16 shrink-0 flex-col border-r border-gray-300 bg-gray-50 sm:w-16 md:w-12 dark:border-gray-800 dark:bg-transparent">
          <div className="h-14 shrink-0 border-b border-gray-300 bg-brand-500 md:h-10 dark:border-gray-800 dark:bg-transparent" />
          {SLOT_TIMES.map((time) => (
            <div
              key={time}
              className="flex h-16 items-start justify-end border-b border-gray-200 pe-2 pt-1.5 text-sm font-medium text-gray-500 tabular-nums md:h-auto md:min-h-[2.125rem] md:flex-1 md:items-center md:pe-1.5 md:pt-0 md:text-[11px] dark:border-gray-800 dark:text-gray-400"
            >
              {time}
            </div>
          ))}
        </div>

        {/* Columnas de días */}
        {DAYS.map((day) => (
          <div
            key={day}
            className={cn(
              "flex min-w-0 flex-1 flex-col border-r border-gray-300 last:border-r-0 dark:border-gray-800",
              day !== activeDay && "hidden md:flex",
            )}
          >
            <div className="flex h-14 shrink-0 items-center justify-center border-b border-gray-300 bg-brand-500 text-base font-semibold text-white capitalize md:h-10 md:text-sm dark:border-gray-800 dark:bg-transparent dark:text-white/90">
              {formatDayShort(day)}
            </div>
            {SLOT_TIMES.map((time) => (
              <SlotCell
                key={time}
                state={slotState(day, time)}
                mode={mode}
                onClick={(state) => onSlotClick(day, time, state)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SlotCell({
  state,
  mode,
  onClick,
}: {
  state: SlotState;
  mode: "public" | "admin";
  onClick: (state: SlotState) => void;
}) {
  // Celular: bloques de 64 px. Escritorio y tablet: se reparten el alto disponible (mínimo 34 px).
  const base =
    "flex h-16 w-full items-center border-b border-gray-200 p-1 text-start md:h-auto md:min-h-[2.125rem] md:flex-1 md:px-1 md:py-0.5 dark:border-gray-800";

  if (state.kind === "free") {
    return (
      <button type="button" onClick={() => onClick(state)} className={cn(base, "group")}>
        <span className="flex h-full w-full items-center justify-center rounded-md text-sm font-medium text-brand-600 transition md:text-xs md:font-normal md:text-gray-400 md:group-hover:bg-brand-50 md:group-hover:font-medium md:group-hover:text-brand-600 dark:text-brand-400 md:dark:text-gray-500 md:dark:group-hover:bg-white/5 md:dark:group-hover:text-brand-400">
          <span className="md:hidden">Disponible</span>
          <span className="hidden md:inline md:group-hover:hidden">Libre</span>
          <span className="hidden md:group-hover:inline">+ Agendar</span>
        </span>
      </button>
    );
  }

  if (state.kind === "blocked") {
    const content = (
      <span className="flex h-full w-full items-center gap-2 overflow-hidden rounded-md bg-gray-100 px-3 text-sm text-gray-500 md:px-2 md:text-xs dark:bg-white/5 dark:text-gray-400">
        <span className="shrink-0 font-medium">No disponible</span>
        <span className="truncate">· {state.block.reason}</span>
      </span>
    );
    if (mode === "admin") {
      return (
        <button type="button" onClick={() => onClick(state)} className={cn(base, "hover:opacity-80")}>
          {content}
        </button>
      );
    }
    return <div className={base}>{content}</div>;
  }

  const { meeting } = state;
  const target = companyById(meeting.targetCompanyId);
  const accent = target?.color ?? "#64748b";
  const content = (
    <span
      title={`${meeting.title} · ${meeting.requesterCompany} con ${target?.name ?? ""}`}
      className="flex h-full w-full items-center gap-2 overflow-hidden rounded-md border border-gray-200 bg-white pe-2 shadow-theme-xs dark:border-gray-700 dark:bg-gray-800"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <span className="min-w-0 flex-1 truncate ps-2 text-sm font-medium text-gray-800 md:text-xs dark:text-white/90">
        {meeting.title}
      </span>
      <span className="shrink-0 text-xs text-gray-500 tabular-nums md:text-[11px] dark:text-gray-400">{meeting.time}</span>
    </span>
  );

  if (mode === "admin") {
    return (
      <button type="button" onClick={() => onClick(state)} className={cn(base, "hover:opacity-80")}>
        {content}
      </button>
    );
  }
  return <div className={base}>{content}</div>;
}
