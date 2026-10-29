import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { seedReference } from "../src/db/seed";
import * as schema from "../src/db/schema";
import type { Db } from "../src/db/client";
import { config } from "../src/lib/config";
import type { MailMessage, MailProvider } from "../src/mail/provider";
import type { BookingContext } from "../src/lib/bookings";
import { AccountError, type AccountMetadata, type AccountProvider } from "../src/lib/account-provider";
import { randomUUID } from "node:crypto";

/** Cuentas de acceso en memoria, con el mismo comportamiento que Supabase Authentication. */
export class FakeAccounts implements AccountProvider {
  store = new Map<string, { email: string; password: string; metadata: AccountMetadata | null }>();

  async create({ email, password, metadata }: { email: string; password: string; metadata: AccountMetadata }): Promise<string> {
    if ([...this.store.values()].some((a) => a.email === email)) throw new AccountError("EMAIL_TAKEN", "Ese correo ya tiene una cuenta de acceso");
    const id = randomUUID();
    this.store.set(id, { email, password, metadata });
    return id;
  }

  async update(id: string, input: { email?: string; password?: string; metadata?: AccountMetadata }): Promise<void> {
    const account = this.store.get(id);
    if (!account) throw new AccountError("UNAVAILABLE", "La cuenta no existe");
    if (input.email !== undefined) account.email = input.email;
    if (input.password !== undefined) account.password = input.password;
    if (input.metadata !== undefined) account.metadata = input.metadata;
  }

  async remove(id: string): Promise<void> {
    this.store.delete(id);
  }

  async signIn(email: string, password: string): Promise<boolean> {
    return [...this.store.values()].some((a) => a.email === email && a.password === password);
  }
}

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
export async function createTestContext(): Promise<BookingContext & { mail: FakeMailProvider; accounts: FakeAccounts; client: PGlite; close: () => Promise<void> }> {
  const client = new PGlite();
  const db = drizzle(client, { schema }) as unknown as Db;
  await migrate(db as unknown as Parameters<typeof migrate>[0], { migrationsFolder: "./drizzle" });
  await seedReference(db, config);

  return {
    db,
    cfg: config,
    mail: new FakeMailProvider(),
    accounts: new FakeAccounts(),
    client,
    close: () => client.close(),
  };
}
