import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { seedReference } from "../src/db/seed";
import * as schema from "../src/db/schema";
import type { Db } from "../src/db/client";
import { config } from "../src/lib/config";
import type { MailMessage, MailProvider } from "../src/mail/provider";
import type { BookingContext } from "../src/lib/bookings";

/** Guarda los correos en memoria y permite simular fallos. */
export class FakeMailProvider implements MailProvider {
  readonly name = "fake";
  sent: MailMessage[] = [];
  shouldFail = false;

  async send(message: MailMessage): Promise<void> {
    if (this.shouldFail) throw new Error("SMTP caído (simulado)");
    this.sent.push(message);
  }
}

/** Postgres en memoria (PGlite), migrado y con empresas y sala del evento. */
export async function createTestContext(): Promise<BookingContext & { mail: FakeMailProvider; client: PGlite; close: () => Promise<void> }> {
  const client = new PGlite();
  const db = drizzle(client, { schema }) as unknown as Db;
  await migrate(db as unknown as Parameters<typeof migrate>[0], { migrationsFolder: "./drizzle" });
  await seedReference(db, config);

  return {
    db,
    cfg: config,
    mail: new FakeMailProvider(),
    client,
    close: () => client.close(),
  };
}
