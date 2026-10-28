import { NextResponse } from "next/server";
import { listAgenda, listStaffUsers } from "@/lib/bookings";
import { requireAdminApi } from "@/lib/admin-auth";
import { defaultContext } from "@/lib/context";

export const dynamic = "force-dynamic";

/** Agenda completa para el panel: reuniones con datos personales, bloqueos y usuarios. */
export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const ctx = await defaultContext();
  const { meetings, blocks } = await listAgenda(ctx, { full: true });
  return NextResponse.json({ meetings, blocks, users: await listStaffUsers(ctx) });
}
