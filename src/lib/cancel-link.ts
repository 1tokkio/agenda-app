import { createHmac, timingSafeEqual } from "node:crypto";

/*
 * Enlace de cancelación que va en el correo de confirmación.
 * El código es una firma del id de la reunión con ADMIN_SESSION_SECRET: quien tiene el enlace
 * puede cancelar esa reunión sin iniciar sesión, y nadie puede armar el enlace de otra.
 */

function secret(): string | null {
  const value = process.env.ADMIN_SESSION_SECRET ?? "";
  return value.length >= 32 ? value : null;
}

/** Código de cancelación de una reunión, o null si el servidor no tiene clave para firmar. */
export function cancelToken(bookingId: string): string | null {
  const key = secret();
  return key ? createHmac("sha256", key).update(`cancel-booking:${bookingId}`).digest("hex") : null;
}

export function isValidCancelToken(bookingId: string, token: string | undefined): boolean {
  const expected = cancelToken(bookingId);
  if (!expected || !token) return false;
  const given = Buffer.from(token);
  const wanted = Buffer.from(expected);
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

/** Dirección de la página de cancelación (`siteUrl` es el origen del sitio, p. ej. https://midominio.cl). */
export function cancelUrl(siteUrl: string, bookingId: string): string | null {
  const token = cancelToken(bookingId);
  return token ? `${siteUrl.replace(/\/+$/, "")}/cancelar/${bookingId}?t=${token}` : null;
}
