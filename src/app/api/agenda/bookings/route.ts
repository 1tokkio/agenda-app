import { NextResponse } from "next/server";
import { createMeeting } from "@/lib/bookings";
import { errorResponse, toBookingInput } from "@/lib/api";
import { currentUser, requireUserApi } from "@/lib/admin-auth";
import { defaultContext } from "@/lib/context";

export const dynamic = "force-dynamic";

/** Agendamiento: cualquier usuario con sesión puede reservar un bloque libre. Queda registrado como creador. El correo lleva el enlace para cancelar. */
export async function POST(request: Request) {
  const denied = await requireUserApi();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const user = await currentUser();
  try {
    const { meeting, mailSent } = await createMeeting(await defaultContext(), toBookingInput(body), user!.id, {
      siteUrl: new URL(request.url).origin,
    });
    return NextResponse.json({ meeting, mailSent }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
