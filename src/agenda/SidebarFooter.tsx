"use client";

import { config } from "@/lib/config";
import { slotsForDay } from "@/lib/slots";
import { useAgenda } from "./store";

/** Bloques de 30 minutos de todo el evento. */
const TOTAL_SLOTS = config.schedule.days.reduce((total, day) => total + slotsForDay(day.date, config).length, 0);

/** Tarjeta al pie del menú: datos del evento para el usuario, ocupación de la sala para el admin. */
export function SidebarFooter({ variant }: { variant: "user" | "admin" }) {
  if (variant === "admin") return <OccupancyCard />;
  return <EventCard />;
}

function EventCard() {
  const first = config.schedule.days[0];
  const last = config.schedule.days[config.schedule.days.length - 1];
  const dayOf = (date: string) => Number(date.slice(8, 10));
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface-2 p-4">
      <span className="text-[13px] font-semibold text-text">{config.subtitle}</span>
      <span className="text-[13px] text-muted">
        {dayOf(first.date)} – {dayOf(last.date)} nov · {first.start} – {last.end}
      </span>
    </div>
  );
}

function OccupancyCard() {
  const { meetings } = useAgenda();
  const percent = TOTAL_SLOTS === 0 ? 0 : Math.round((meetings.length / TOTAL_SLOTS) * 100);
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface-2 p-4">
      <span className="text-[13px] font-semibold text-text">{config.subtitle}</span>
      <div className="h-1.5 overflow-hidden rounded-full bg-border-soft">
        <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-xs text-muted">{percent}% de la sala reservada</span>
    </div>
  );
}
