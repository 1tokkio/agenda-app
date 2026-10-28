import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const ADMIN_COOKIE = "admin_session";
const SESSION_SECONDS = 60 * 60 * 12;

/** PIN de la organización. Sin ADMIN_PIN no hay acceso al panel. */
export function adminPin(): string | undefined {
  return process.env.ADMIN_PIN || undefined;
}

export function checkPin(input: string): boolean {
  const pin = adminPin();
  if (!pin) return false;
  // Comparamos hashes de igual longitud para que timingSafeEqual funcione.
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(pin).digest();
  return timingSafeEqual(a, b);
}

/** Valor de la cookie de sesión: un HMAC del PIN, nunca el PIN en claro. */
export function sessionValue(): string | undefined {
  const pin = adminPin();
  if (!pin) return undefined;
  return createHmac("sha256", pin).update("admin-session-v1").digest("hex");
}

export function isValidSession(value: string | undefined): boolean {
  const expected = sessionValue();
  if (!expected || !value) return false;
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
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
  const jar = await cookies();
  if (isValidSession(jar.get(ADMIN_COOKIE)?.value)) return null;
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

export async function hasAdminSession(): Promise<boolean> {
  const jar = await cookies();
  return isValidSession(jar.get(ADMIN_COOKIE)?.value);
}
