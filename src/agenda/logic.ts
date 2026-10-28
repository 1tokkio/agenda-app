import { TIME_ZONE } from "./data";

/** "miércoles 18 de noviembre". */
export function formatDayLabel(date: string): string {
  return new Intl.DateTimeFormat("es", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
}

/** "mié, 18 nov". */
export function formatDayShort(date: string): string {
  return new Intl.DateTimeFormat("es", {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T12:00:00`));
}

/** Hora de término: cada reunión dura un bloque de 30 minutos. */
export function endTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + 30;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
