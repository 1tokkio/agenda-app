import { NextResponse } from "next/server";
import { createStaffUser } from "@/lib/bookings";
import { errorResponse } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { defaultContext } from "@/lib/context";

export const dynamic = "force-dynamic";

/** Crea un usuario del personal (solo admin, máximo 30). */
export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  try {
    const user = await createStaffUser(await defaultContext(), {
      name: typeof body?.name === "string" ? body.name : "",
      email: typeof body?.email === "string" ? body.email : "",
      companyId: typeof body?.companyId === "string" ? body.companyId : "",
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
