import { NextResponse } from "next/server";
import { getProfile, updateProfile } from "@/lib/bookings";
import { errorResponse } from "@/lib/api";
import { currentUser, requireUserApi } from "@/lib/admin-auth";
import { defaultContext } from "@/lib/context";

export const dynamic = "force-dynamic";

/** Perfil del usuario con sesión. Cada usuario solo lee y cambia su propio perfil. */
export async function GET() {
  const denied = await requireUserApi();
  if (denied) return denied;

  const user = await currentUser();
  try {
    return NextResponse.json({ profile: await getProfile(await defaultContext(), user!.id) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(request: Request) {
  const denied = await requireUserApi();
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const text = (key: string) => (typeof body?.[key] === "string" ? (body[key] as string) : "");
  const user = await currentUser();
  try {
    const profile = await updateProfile(await defaultContext(), user!.id, {
      name: text("name"),
      email: text("email"),
      jobTitle: text("jobTitle"),
      phone: text("phone"),
      companyName: text("companyName"),
    });
    return NextResponse.json({ profile });
  } catch (err) {
    return errorResponse(err);
  }
}
