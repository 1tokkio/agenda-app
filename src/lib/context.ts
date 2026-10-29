import { getDb } from "@/db/client";
import { getMailProvider } from "@/mail";
import { supabaseAccounts } from "./account-provider";
import { config } from "./config";
import type { BookingContext } from "./bookings";

/** Dependencias reales para los servicios: base de datos, correo y cuentas de acceso en Supabase. */
export async function defaultContext(): Promise<BookingContext> {
  return { db: await getDb(), cfg: config, mail: getMailProvider(), accounts: supabaseAccounts() };
}
