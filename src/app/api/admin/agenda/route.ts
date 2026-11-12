import { NextResponse } from "next/server";
import { listAgenda, listStaffUsers } from "@/lib/bookings";
import { requireAdminApi } from "@/lib/admin-auth";
import { defaultContext } from "@/lib/context";

export const dynamic = "force-dynamic";

/** Agenda completa para el panel: reuniones con datos personales, bloqueos y usuarios. */
export async function GET(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const ctx = await defaultContext();
  const viewerToken = request.headers.get("x-hold-token") ?? undefined;
  const { meetings, blocks, holds } = await listAgenda(ctx, { full: true, viewerToken });
  return NextResponse.json({ meetings, blocks, holds, users: await listStaffUsers(ctx) });
}
