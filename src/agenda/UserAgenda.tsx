"use client";

import { useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { DAYS, SLOT_TIMES, TIME_ZONE, type Meeting } from "./data";
import { endTime } from "./logic";
import { useAgenda, type SlotState } from "./store";

/** Empresa del usuario con sesión: la asigna el admin y su nombre lo escribe el propio usuario en el perfil. */
export type MyCompany = { companyId: string; companyName: string | null };

type View = "days" | "week";

/** Alto de un bloque de 30 min en escritorio (--slot-h de tokens.css). */
const ROW_H = 52;
/** Columna de horas: "GMT-3" arriba y la hora de cada bloque. */
const TIME_COL_W = 76;

/**
 * Agenda del usuario: los días del evento en columnas (vista "3 días") o la semana completa (vista "Semana").
 * Los días fuera del evento se muestran como columna rayada y no se pueden tocar.
 * En celular se ve un día a la vez, con pestañas para elegirlo.
 */
export function UserAgenda({
  me,
  onSlotClick,
  onBookDay,
}: {
  me: MyCompany | null;
  onSlotClick: (date: string, time: string, state: SlotState) => void;
  /** Abre la reserva del primer horario libre del día. */
  onBookDay: (date: string) => void;
}) {
  const { slotState, meetings } = useAgenda();
  const [view, setView] = useState<View>("days");
  const [activeDay, setActiveDay] = useState<string>(DAYS[0]);
  const now = useClock();

  const columnDates = view === "week" ? weekAround(DAYS[0]) : DAYS;
  const columns = columnDates.map((date) => ({ date, isEvent: DAYS.includes(date) }));
  const first = columnDates[0];
  const last = columnDates[columnDates.length - 1];

  const freeOn = (date: string) => SLOT_TIMES.filter((time) => slotState(date, time).kind === "free").length;

  return (
    <div className="flex flex-col gap-4">
      {/* Pestañas de día para celular */}
      <div role="tablist" aria-label="Días del evento" className="grid grid-cols-3 gap-1 rounded-[14px] border border-border bg-surface-2 p-1 md:hidden">
        {DAYS.map((date) => (
          <button
            key={date}
            type="button"
            role="tab"
            aria-selected={date === activeDay}
            onClick={() => setActiveDay(date)}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-xs",
              date === activeDay ? "border border-border bg-surface text-text shadow-sm" : "text-muted",
            )}
          >
            <span className="font-medium">{weekdayShort(date)}</span>
            <span className="text-lg" style={{ fontFamily: "var(--font-display)" }}>
              {dayNumber(date)}
            </span>
            <span className="text-[11px]">{freeOn(date)} libres</span>
          </button>
        ))}
      </div>

      <section aria-label="Agenda de la sala" className="overflow-hidden rounded-2xl border border-border bg-surface">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="w-14 overflow-hidden rounded-[10px] border border-border text-center">
              <div className="border-b border-border bg-surface-2 py-0.5 text-[11px] font-semibold tracking-[0.08em] text-muted">NOV</div>
              <div className="py-0.5 text-[22px] font-medium text-brand" style={{ fontFamily: "var(--font-display)" }}>
                {dayNumber(activeDay)}
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xl font-medium text-text" style={{ fontFamily: "var(--font-display)" }}>
                {view === "week" ? `${dayNumber(first)} – ${dayNumber(last)} de noviembre, 2026` : "18 – 20 de noviembre, 2026"}
              </span>
              <span className="text-[13px] text-muted">
                {view === "week" ? "Agenda habilitada en los días del evento" : "Expocorma 2026 · 3 días de evento"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Rango visible" className="flex gap-0.5 rounded-[10px] border border-border bg-surface-2 p-0.5">
              <SegmentButton active={view === "days"} onClick={() => setView("days")}>
                3 días
              </SegmentButton>
              <SegmentButton active={view === "week"} onClick={() => setView("week")}>
                Semana
              </SegmentButton>
            </div>
            {/* Solo hay un evento: las flechas quedan deshabilitadas hasta que haya otras fechas que mostrar. */}
            <button type="button" disabled aria-label="Período anterior" className={navButtonClass}>
              <ChevronIcon direction="left" />
            </button>
            <button
              type="button"
              onClick={() => setActiveDay(DAYS[0])}
              className="h-10 rounded-[10px] border border-border bg-surface px-3.5 text-sm font-medium text-text-2 hover:bg-surface-2"
            >
              Hoy
            </button>
            <button type="button" disabled aria-label="Período siguiente" className={navButtonClass}>
              <ChevronIcon direction="right" />
            </button>
            <button
              type="button"
              onClick={() => onBookDay(activeDay)}
              className="h-10 rounded-[10px] bg-brand px-4 text-sm font-semibold text-brand-ink hover:brightness-110"
            >
              Agendar reunión
            </button>
          </div>
        </header>

        <Legend />

        <div className="overflow-x-auto">
          <div className={cn("flex", view === "week" ? "md:min-w-[1040px]" : "md:min-w-[640px]")}>
            {/* Columna de horas */}
            <div className="shrink-0" style={{ flex: `0 0 ${TIME_COL_W}px` }}>
              <div className="flex h-[76px] items-end justify-end pe-3 pb-3 text-[11px] text-muted">GMT-3</div>
              {SLOT_TIMES.map((time) => (
                <div key={time} className="pe-3 pt-1.5 text-end text-xs font-medium text-muted tabular-nums" style={{ height: ROW_H }}>
                  {time}
                </div>
              ))}
            </div>

            {columns.map(({ date, isEvent }) => {
              const selected = date === activeDay;
              return (
                <div
                  key={date}
                  className={cn("flex min-w-0 flex-col border-s border-border", !selected && "hidden md:flex")}
                  style={{ flex: isEvent ? "1 1 0" : "0.55 1 0" }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveDay(date)}
                    disabled={!isEvent}
                    aria-pressed={selected}
                    className="flex h-[76px] items-center gap-3 border-b border-border px-3.5 text-start disabled:cursor-default"
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl",
                        selected && isEvent ? "bg-brand text-brand-ink" : "text-text",
                      )}
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {dayNumber(date)}
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      {isEvent ? (
                        <>
                          <span className="truncate text-[13px] font-medium text-text">{weekdayLong(date)}</span>
                          <span className="truncate text-xs text-muted">{freeOn(date)} bloques libres</span>
                        </>
                      ) : (
                        <span className="truncate text-xs font-medium text-muted">{weekdayShort(date)}</span>
                      )}
                    </span>
                  </button>

                  <div className={cn("relative flex-1", !isEvent && "col-off")}>
                    {isEvent &&
                      SLOT_TIMES.map((time) => (
                        <div key={time} className="border-t border-border-soft px-1.5 py-1" style={{ height: ROW_H }}>
                          <SlotCell
                            date={date}
                            time={time}
                            weekday={weekdayLong(date)}
                            state={slotState(date, time)}
                            isOwn={isOwnSlot(slotState(date, time), me)}
                            onPick={onSlotClick}
                          />
                        </div>
                      ))}

                    {isEvent && now && now.date === date && <NowLine minutes={now.minutes} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {meetings.length === 0 && (
          <p className="border-t border-border px-5 py-3 text-center text-sm text-muted">Todavía no hay reuniones agendadas.</p>
        )}
      </section>
    </div>
  );
}

/** Una celda de bloque, con uno de los estados del diseño. */
function SlotCell({
  date,
  time,
  weekday,
  state,
  isOwn,
  onPick,
}: {
  date: string;
  time: string;
  weekday: string;
  state: SlotState;
  isOwn: boolean;
  onPick: (date: string, time: string, state: SlotState) => void;
}) {
  const range = `${time} – ${endTime(time)}`;

  if (state.kind === "free") {
    return (
      <button
        type="button"
        onClick={() => onPick(date, time, state)}
        aria-label={`Agendar ${weekday} ${dayNumber(date)} a las ${time}`}
        className="group flex h-full w-full items-center justify-center rounded-lg text-xs font-medium text-brand-text transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand"
      >
        <span className="opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100">
          + Agendar {time}
        </span>
      </button>
    );
  }

  if (state.kind === "blocked") {
    return (
      <div className="hatch flex h-full items-center justify-center rounded-lg text-[11px] font-medium text-muted">No disponible</div>
    );
  }

  if (isOwn) {
    return (
      <div
        className="flex h-full min-w-0 flex-col justify-center rounded-lg border px-2.5 py-1"
        style={{ background: "var(--own-bg)", borderColor: "var(--own-bd)", color: "var(--brand-text)" }}
        aria-label={`Reunión de tu empresa: ${state.meeting.title}, ${range}`}
      >
        <span className="truncate text-xs font-semibold">{state.meeting.title}</span>
        <span className="truncate text-[11px] tabular-nums">{range}</span>
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-w-0 flex-col justify-center rounded-lg border px-2.5 py-1"
      style={{ background: "var(--taken-bg)", borderColor: "var(--taken-bd)" }}
      aria-label={`Reservado, ${range}`}
    >
      <span className="truncate text-xs font-medium text-text-2">Reservado</span>
      <span className="truncate text-[11px] text-muted tabular-nums">{range}</span>
    </div>
  );
}

function NowLine({ minutes }: { minutes: number }) {
  const start = toMinutes(SLOT_TIMES[0]);
  const end = toMinutes(endTime(SLOT_TIMES[SLOT_TIMES.length - 1]));
  if (minutes < start || minutes >= end) return null;
  const top = ((minutes - start) / 30) * ROW_H;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute end-0 start-[-5px] flex items-center" style={{ top }}>
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: "var(--now)" }} />
      <span className="h-0.5 flex-1" style={{ background: "var(--now)" }} />
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 border-b border-border px-5 py-3 text-[13px] text-text-2">
      <LegendItem>
        <span className="h-3.5 w-3.5 rounded border border-dashed border-brand" /> Disponible
      </LegendItem>
      <LegendItem>
        <span className="h-3.5 w-3.5 rounded border" style={{ background: "var(--own-bg)", borderColor: "var(--own-bd)" }} /> Tu empresa
      </LegendItem>
      <LegendItem>
        <span className="h-3.5 w-3.5 rounded border" style={{ background: "var(--taken-bg)", borderColor: "var(--taken-bd)" }} /> Reservado
      </LegendItem>
      <LegendItem>
        <span className="hatch h-3.5 w-3.5 rounded border border-border" /> No disponible
      </LegendItem>
    </div>
  );
}

function LegendItem({ children }: { children: React.ReactNode }) {
  return <span className="flex items-center gap-2">{children}</span>;
}

function SegmentButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-8 rounded-lg px-3.5 text-[13px] font-medium",
        active ? "bg-surface text-text shadow-sm ring-1 ring-border" : "text-muted hover:text-text-2",
      )}
    >
      {children}
    </button>
  );
}

const navButtonClass =
  "flex h-10 w-10 items-center justify-center rounded-[10px] border border-border bg-surface text-text-2 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-45";

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={direction === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

/** Una reunión es "de mi empresa" si la visitada es mi empresa, o si quien reservó escribió mi nombre de empresa. */
/** Un bloque reservado es "de mi empresa" según la misma regla de la reunión. */
function isOwnSlot(state: SlotState, me: MyCompany | null): boolean {
  return state.kind === "booked" && isOwnMeeting(state.meeting, me);
}

export function isOwnMeeting(meeting: Meeting, me: MyCompany | null): boolean {
  if (!me) return false;
  if (meeting.targetCompanyId === me.companyId) return true;
  return !!me.companyName && meeting.requesterCompany.trim().toLowerCase() === me.companyName.trim().toLowerCase();
}

/* ---------- Fechas ---------- */

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Semana (lunes a domingo) que contiene el día dado. */
function weekAround(date: string): string[] {
  const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
  const monday = addDays(date, dow === 0 ? -6 : 1 - dow);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

function dayNumber(date: string): number {
  return Number(date.slice(8, 10));
}

function weekdayLong(date: string): string {
  const text = new Intl.DateTimeFormat("es", { timeZone: TIME_ZONE, weekday: "long" }).format(new Date(`${date}T12:00:00`));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function weekdayShort(date: string): string {
  return new Intl.DateTimeFormat("es", { timeZone: TIME_ZONE, weekday: "short" }).format(new Date(`${date}T12:00:00`)).replace(".", "").toUpperCase();
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/* ---------- Reloj: la línea de "ahora" se actualiza cada minuto ---------- */

function subscribeClock(onChange: () => void) {
  const timer = setInterval(onChange, 60_000);
  return () => clearInterval(timer);
}

/** Minuto actual en la zona del evento, o null en el servidor (evita diferencias al cargar). */
export function useClock(): { date: string; minutes: number } | null {
  const stamp = useSyncExternalStore(subscribeClock, () => Math.floor(Date.now() / 60_000), () => 0);
  if (stamp === 0) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(stamp * 60_000));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}
