import { NextResponse } from "next/server";
import { BookingError, cancelMeeting, getMeetingSummary } from "@/lib/bookings";
import { isValidCancelToken } from "@/lib/cancel-link";
import { defaultContext } from "@/lib/context";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Cancela una reunión desde el enlace del correo de confirmación. No pide sesión: el código firmado del enlace
 * es el permiso. Solo responde a POST (el botón de la página), para que abrir el enlace no cancele nada.
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const form = await request.formData().catch(() => null);
  const token = form?.get("t");
  const back = new URL(`/cancelar/${id}`, request.url);
  if (typeof token === "string") back.searchParams.set("t", token);

  if (typeof token !== "string" || !isValidCancelToken(id, token)) {
    return NextResponse.redirect(back, 303);
  }

  const ctx = await defaultContext();
  const meeting = await getMeetingSummary(ctx, id);
  // Solo se cancela una reunión confirmada que todavía no empieza; en los demás casos la página explica el estado.
  if (meeting?.status === "confirmed" && meeting.upcoming) {
    try {
      await cancelMeeting(ctx, id);
    } catch (err) {
      if (!(err instanceof BookingError)) throw err;
    }
  }
  return NextResponse.redirect(back, 303);
}
