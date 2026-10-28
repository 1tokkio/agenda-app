import { NextResponse } from "next/server";
import { createMeeting } from "@/lib/bookings";
import { errorResponse, toBookingInput } from "@/lib/api";
import { defaultContext } from "@/lib/context";

export const dynamic = "force-dynamic";

/** Agendamiento público: cualquier visitante puede reservar un bloque libre. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  try {
    const { meeting, mailSent } = await createMeeting(await defaultContext(), toBookingInput(body));
    return NextResponse.json({ meeting, mailSent }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
