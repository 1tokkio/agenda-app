import { NextResponse } from "next/server";
import { unblockSlot } from "@/lib/bookings";
import { errorResponse } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { defaultContext } from "@/lib/context";

export const dynamic = "force-dynamic";

/** Libera un horario bloqueado (solo admin). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await params;
  try {
    await unblockSlot(await defaultContext(), id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
