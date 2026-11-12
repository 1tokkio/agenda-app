import { NextResponse } from "next/server";
import { acquireHold, releaseHold } from "@/lib/bookings";
import { errorResponse } from "@/lib/api";
import { requireUserApi } from "@/lib/admin-auth";
import { defaultContext } from "@/lib/context";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

const text = (body: Record<string, unknown> | null, key: string) => (typeof body?.[key] === "string" ? (body[key] as string) : "");

/**
 * Retiene un horario libre mientras el dispositivo llena el formulario de reserva: nadie más puede tomarlo
 * hasta que reserve, lo suelte o venza. `token` identifica al dispositivo (lo genera la página al abrirse).
 */
export async function POST(request: Request) {
  const denied = await requireUserApi();
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  try {
    await acquireHold(await defaultContext(), { date: text(body, "date"), time: text(body, "time") }, text(body, "token"));
    return NextResponse.json({ ok: true, ttlSeconds: config.holdSeconds });
  } catch (err) {
    return errorResponse(err);
  }
}

/** Suelta el horario que retiene el dispositivo (al cerrar el formulario sin reservar). */
export async function DELETE(request: Request) {
  const denied = await requireUserApi();
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const token = text(body, "token");
  if (token) await releaseHold(await defaultContext(), token);
  return NextResponse.json({ ok: true });
}
