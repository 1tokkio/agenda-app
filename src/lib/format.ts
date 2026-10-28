import { zonedTimeToUtc } from "./time";

/** Fecha YYYY-MM-DD de un instante, vista desde la zona del evento. */
export function isoDateInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Hora HH:mm de un instante, en la zona del evento. */
export function formatHour(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("es", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

/** "martes 10 de noviembre de 2026". */
export function formatDayLong(date: string, timeZone: string): string {
  const noon = new Date(zonedTimeToUtc(date, "12:00", timeZone));
  return new Intl.DateTimeFormat("es", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(noon);
}

/** "mar 10 nov". Para las pestañas de días. */
export function formatDayShort(date: string, timeZone: string): string {
  const noon = new Date(zonedTimeToUtc(date, "12:00", timeZone));
  return new Intl.DateTimeFormat("es", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(noon);
}
