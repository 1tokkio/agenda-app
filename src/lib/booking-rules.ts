import type { EventConfig } from "@config/event";
import { slotsForDay } from "./slots";
import { zonedTimeToUtc } from "./time";

/*
 * Reglas de agendamiento compartidas por la API y la interfaz.
 * Son funciones puras (sin base de datos): los conflictos de horario los verifica el servicio
 * dentro de una transacción y la base los vuelve a imponer con índices únicos.
 */

export type BookingInput = {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm, inicio del bloque
  title: string;
  requesterName: string;
  requesterCompany: string; // empresa de quien agenda (texto libre)
  targetCompanyId: string; // empresa con la que se reúne
  requesterEmail: string; // notificación y confirmación
  guestEmail?: string; // opcional: la otra persona
};

/** Errores por campo: los de la reserva y los de los datos de acceso del personal. */
export type FieldErrors = Partial<Record<keyof BookingInput | "username" | "password", string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Valida los campos de una reserva. Devuelve un mensaje por campo con error (vacío si todo está bien). */
export function validateBooking(input: BookingInput, cfg: EventConfig): FieldErrors {
  const errors: FieldErrors = {};
  const title = input.title.trim();
  const guest = input.guestEmail?.trim() ?? "";
  const requester = input.requesterEmail.trim();

  const day = cfg.schedule.days.find((d) => d.date === input.date);
  if (!day) {
    errors.date = "El día no pertenece al evento";
  } else {
    const starts = slotsForDay(input.date, cfg).map((s) => s.startsAt);
    if (!starts.includes(zonedTimeToUtc(input.date, input.time, cfg.timezone))) {
      errors.time = "El horario no corresponde a un bloque del evento";
    }
  }

  if (title.length < 3) errors.title = "Escribe un título de al menos 3 caracteres";
  if (title.length > 120) errors.title = "El título no puede superar 120 caracteres";
  if (input.requesterName.trim().length < 2) errors.requesterName = "Escribe tu nombre";
  if (input.requesterCompany.trim().length < 2) errors.requesterCompany = "Escribe el nombre de tu empresa";
  if (!cfg.companies.some((c) => c.id === input.targetCompanyId)) {
    errors.targetCompanyId = "Elige con qué empresa te reúnes";
  }
  if (!EMAIL.test(requester)) errors.requesterEmail = "Correo no válido";
  if (guest && !EMAIL.test(guest)) errors.guestEmail = "Correo no válido";
  if (guest && guest.toLowerCase() === requester.toLowerCase()) {
    errors.guestEmail = "Debe ser un correo distinto al tuyo";
  }

  return errors;
}

export function isValidEmail(value: string): boolean {
  return EMAIL.test(value.trim());
}
