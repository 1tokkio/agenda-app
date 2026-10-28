import { NextResponse } from "next/server";
import type { BookingInput } from "./booking-rules";
import { BookingError } from "./bookings";

const STATUS: Record<BookingError["code"], number> = {
  NOT_FOUND: 404,
  INVALID: 400,
  CONFLICT: 409,
};

/** Toma los campos de una reserva desde el cuerpo JSON, sin confiar en los tipos que envíe el cliente. */
export function toBookingInput(body: unknown): BookingInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const text = (key: string) => (typeof b[key] === "string" ? (b[key] as string) : "");
  return {
    date: text("date"),
    time: text("time"),
    title: text("title"),
    requesterName: text("requesterName"),
    requesterCompany: text("requesterCompany"),
    targetCompanyId: text("targetCompanyId"),
    requesterEmail: text("requesterEmail"),
    guestEmail: text("guestEmail") || undefined,
  };
}

/** Convierte un error de dominio en respuesta HTTP; cualquier otro error se relanza. */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof BookingError) {
    return NextResponse.json({ error: err.message, fields: err.fields }, { status: STATUS[err.code] });
  }
  throw err;
}
