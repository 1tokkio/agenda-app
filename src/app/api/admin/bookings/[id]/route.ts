import { NextResponse } from "next/server";
import { cancelMeeting, updateMeeting } from "@/lib/bookings";
import { errorResponse, toBookingInput } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { defaultContext } from "@/lib/context";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Edita una reunión (solo admin). */
export async function PUT(request: Request, { params }: Params) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  try {
    return NextResponse.json({ meeting: await updateMeeting(await defaultContext(), id, toBookingInput(body)) });
  } catch (err) {
    return errorResponse(err);
  }
}

/** Cancela una reunión (solo admin): el horario queda libre. */
export async function DELETE(_request: Request, { params }: Params) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await params;
  try {
    await cancelMeeting(await defaultContext(), id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
