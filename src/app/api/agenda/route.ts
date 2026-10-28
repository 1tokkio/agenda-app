import { NextResponse } from "next/server";
import { listAgenda } from "@/lib/bookings";
import { defaultContext } from "@/lib/context";

export const dynamic = "force-dynamic";

/** Agenda pública: reuniones (sin datos personales) y bloqueos. */
export async function GET() {
  const { meetings, blocks } = await listAgenda(await defaultContext(), { full: false });
  return NextResponse.json({ meetings, blocks });
}
