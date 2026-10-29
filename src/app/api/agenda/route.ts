import { NextResponse } from "next/server";
import { listAgenda } from "@/lib/bookings";
import { requireUserApi } from "@/lib/admin-auth";
import { defaultContext } from "@/lib/context";

export const dynamic = "force-dynamic";

/** Agenda de la reunión: reuniones (sin datos personales) y bloqueos. Solo para usuarios con sesión. */
export async function GET() {
  const denied = await requireUserApi();
  if (denied) return denied;

  const { meetings, blocks } = await listAgenda(await defaultContext(), { full: false });
  return NextResponse.json({ meetings, blocks });
}
