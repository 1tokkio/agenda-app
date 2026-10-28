import { NextResponse } from "next/server";
import { deleteStaffUser } from "@/lib/bookings";
import { errorResponse } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { defaultContext } from "@/lib/context";

export const dynamic = "force-dynamic";

/** Quita un usuario del personal (solo admin). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await params;
  try {
    await deleteStaffUser(await defaultContext(), id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
