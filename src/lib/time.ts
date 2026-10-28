/*
 * Conversión entre "hora de pared" de la zona del evento y UTC.
 * Usa Intl, así que no depende de librerías externas ni del huso del servidor.
 */

const formatters = new Map<string, Intl.DateTimeFormat>();

function wallClockFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** Diferencia (ms) entre la hora de pared de `timeZone` y UTC en ese instante. */
function offsetMs(utcMs: number, timeZone: string): number {
  const parts = Object.fromEntries(
    wallClockFormatter(timeZone)
      .formatToParts(new Date(utcMs))
      .map((p) => [p.type, p.value]),
  );
  const wallAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return wallAsUtc - Math.floor(utcMs / 1000) * 1000;
}

/**
 * Convierte "2026-11-10" + "09:30" en la zona `timeZone` a epoch en ms (UTC).
 * Dos pasadas para que funcione también cerca de cambios de horario (DST).
 */
export function zonedTimeToUtc(date: string, time: string, timeZone: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const firstGuess = wall - offsetMs(wall, timeZone);
  return wall - offsetMs(firstGuess, timeZone);
}
