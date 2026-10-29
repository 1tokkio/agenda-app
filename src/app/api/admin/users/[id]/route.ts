import { NextResponse } from "next/server";
import { deleteStaffUser } from "@/lib/bookings";
import { errorResponse } from "@/lib/api";
import { currentUser, requireAdminApi } from "@/lib/admin-auth";
import { defaultContext } from "@/lib/context";

export const dynamic = "force-dynamic";

/** Quita un usuario (solo administradores). No puedes quitarte a ti mismo. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await params;
  const admin = await currentUser();
  try {
    await deleteStaffUser(await defaultContext(), id, admin!.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
