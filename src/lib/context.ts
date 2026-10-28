import { getDb } from "@/db/client";
import { getMailProvider } from "@/mail";
import { config } from "./config";
import type { BookingContext } from "./bookings";

/** Dependencias reales para los servicios: base de datos y proveedor de correo. */
export async function defaultContext(): Promise<BookingContext> {
  return { db: await getDb(), cfg: config, mail: getMailProvider() };
}
