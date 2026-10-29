import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, sessionCookie, sessionSecretConfigured, sessionValue } from "@/lib/admin-auth";
import { authenticateStaff } from "@/lib/bookings";
import { defaultContext } from "@/lib/context";

export const dynamic = "force-dynamic";

/** Inicio de sesión con usuario y contraseña del personal. */
export async function POST(request: Request) {
  if (!sessionSecretConfigured()) {
    return NextResponse.json(
      { error: "Falta ADMIN_SESSION_SECRET en el servidor (mínimo 32 caracteres)." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as { username?: unknown; password?: unknown } | null;
  const username = typeof body?.username === "string" ? body.username : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const user = username && password ? await authenticateStaff(await defaultContext(), username, password) : null;
  if (!user) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
  }

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, sessionValue(user.id), sessionCookie);
  return NextResponse.json({ ok: true });
}
