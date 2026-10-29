import { NextResponse } from "next/server";
import { listAgenda } from "@/lib/bookings";
import { currentUser, requireUserApi } from "@/lib/admin-auth";
import { defaultContext } from "@/lib/context";

export const dynamic = "force-dynamic";

/** Agenda de la reunión: reuniones (el título solo para quien la creó) y bloqueos. Solo para usuarios con sesión. */
export async function GET() {
  const denied = await requireUserApi();
  if (denied) return denied;

  const user = await currentUser();
  const { meetings, blocks } = await listAgenda(await defaultContext(), { full: false, viewerId: user!.id });
  return NextResponse.json({ meetings, blocks });
}
