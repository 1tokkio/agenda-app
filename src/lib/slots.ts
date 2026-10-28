import type { EventConfig } from "@config/event";
import { zonedTimeToUtc } from "./time";

export type Slot = {
  date: string; // YYYY-MM-DD
  startsAt: number; // epoch ms (UTC)
  endsAt: number;
};

/** Bloques de un día, según los horarios de config/event.ts. */
export function slotsForDay(date: string, cfg: EventConfig): Slot[] {
  const day = cfg.schedule.days.find((d) => d.date === date);
  if (!day) return [];

  const step = cfg.schedule.slotMinutes * 60_000;
  const dayEnd = zonedTimeToUtc(date, day.end, cfg.timezone);
  const slots: Slot[] = [];

  for (
    let start = zonedTimeToUtc(date, day.start, cfg.timezone);
    start + step <= dayEnd;
    start += step
  ) {
    slots.push({ date, startsAt: start, endsAt: start + step });
  }
  return slots;
}

/** Todos los bloques del evento, en orden. */
export function allSlots(cfg: EventConfig): Slot[] {
  return cfg.schedule.days.flatMap((d) => slotsForDay(d.date, cfg));
}

/** Devuelve el bloque que empieza exactamente en `startsAt`, o undefined. */
export function findSlot(startsAt: number, cfg: EventConfig): Slot | undefined {
  return allSlots(cfg).find((s) => s.startsAt === startsAt);
}
