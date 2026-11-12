import { NextResponse } from "next/server";
import { listAgenda } from "@/lib/bookings";
import { currentUser, requireUserApi } from "@/lib/admin-auth";
import { defaultContext } from "@/lib/context";

export const dynamic = "force-dynamic";

/**
 * Agenda de la reunión: reuniones (el título solo para quien la creó), bloqueos y horarios que alguien está reservando
 * en este momento. Solo para usuarios con sesión. El encabezado x-hold-token marca cuáles retiene este dispositivo.
 */
export async function GET(request: Request) {
  const denied = await requireUserApi();
  if (denied) return denied;

  const user = await currentUser();
  const viewerToken = request.headers.get("x-hold-token") ?? undefined;
  const { meetings, blocks, holds } = await listAgenda(await defaultContext(), { full: false, viewerId: user!.id, viewerToken });
  return NextResponse.json({ meetings, blocks, holds });
}
