import { NextResponse } from "next/server";
import { blockSlot } from "@/lib/bookings";
import { errorResponse } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { defaultContext } from "@/lib/context";

export const dynamic = "force-dynamic";

/** Bloquea un horario (publicidad, pantalla ocupada, etc.). */
export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  try {
    const block = await blockSlot(await defaultContext(), {
      date: typeof body?.date === "string" ? body.date : "",
      time: typeof body?.time === "string" ? body.time : "",
      reason: typeof body?.reason === "string" ? body.reason : "",
    });
    return NextResponse.json({ block }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
