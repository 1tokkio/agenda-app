import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminPin, checkPin, sessionCookie, sessionValue } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!adminPin()) {
    return NextResponse.json(
      { error: "El PIN no está configurado en el servidor (ADMIN_PIN)." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as { pin?: unknown } | null;
  const pin = typeof body?.pin === "string" ? body.pin : "";

  if (!checkPin(pin)) {
    return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
  }

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, sessionValue()!, sessionCookie);
  return NextResponse.json({ ok: true });
}
