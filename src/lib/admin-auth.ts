import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { staffUsers } from "@/db/schema";

export const ADMIN_COOKIE = "admin_session";
const SESSION_SECONDS = 60 * 60 * 12;

export type AdminUser = { id: string; name: string; email: string; username: string };

/** Clave para firmar las sesiones. Sin ADMIN_SESSION_SECRET (32 caracteres o más) no hay acceso al panel. */
export function sessionSecretConfigured(): boolean {
  return (process.env.ADMIN_SESSION_SECRET ?? "").length >= 32;
}

function sign(userId: string): string {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET!).update(`admin-session:${userId}`).digest("hex");
}

/** Valor de la cookie: "<id del usuario>.<firma>". La firma impide crear sesiones a mano. */
export function sessionValue(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

/** Id del usuario si la cookie tiene una firma válida. */
function userIdFromCookie(value: string | undefined): string | null {
  if (!value || !sessionSecretConfigured()) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const userId = value.slice(0, dot);
  const given = Buffer.from(value.slice(dot + 1));
  const expected = Buffer.from(sign(userId));
  return given.length === expected.length && timingSafeEqual(given, expected) ? userId : null;
}

/** Usuario de la sesión actual, o null. Confirma en la base que el usuario sigue existiendo. */
export async function currentAdmin(): Promise<AdminUser | null> {
  const jar = await cookies();
  const userId = userIdFromCookie(jar.get(ADMIN_COOKIE)?.value);
  if (!userId) return null;
  const [user] = await (await getDb())
    .select({ id: staffUsers.id, name: staffUsers.name, email: staffUsers.email, username: staffUsers.username })
    .from(staffUsers)
    .where(eq(staffUsers.id, userId))
    .limit(1);
  return user ?? null;
}

export const sessionCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_SECONDS,
  secure: process.env.NODE_ENV === "production",
};

/** Para route handlers: responde 401 si no hay sesión válida. */
export async function requireAdminApi(): Promise<NextResponse | null> {
  if (await currentAdmin()) return null;
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

export async function hasAdminSession(): Promise<boolean> {
  return (await currentAdmin()) !== null;
}
