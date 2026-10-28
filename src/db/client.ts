import { drizzle as drizzlePostgres, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/*
 * Conexión a la base de datos.
 * - Con DATABASE_URL (Supabase u otro Postgres): se usa esa base. Es obligatorio en producción.
 * - Sin DATABASE_URL (desarrollo): PGlite, Postgres dentro de la app, guardado en ./data/pglite.
 *   Antes de usarlo hay que aplicar las migraciones con `npm run db:migrate`.
 */
export type Db = PostgresJsDatabase<typeof schema>;

type Connection = { db: Db; close: () => Promise<void> };

const globalForDb = globalThis as unknown as { connection?: Promise<Connection> };

async function connect(): Promise<Connection> {
  const url = process.env.DATABASE_URL;

  if (url) {
    // prepare: false permite usar el pooler de Supabase (modo transacción).
    const client = postgres(url, { prepare: false, max: 5 });
    return { db: drizzlePostgres(client, { schema }), close: () => client.end() };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL no está configurada. Define la conexión a Supabase en las variables del proyecto.");
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
  const client = new PGlite(process.env.PGLITE_DIR ?? "./data/pglite");
  // PGlite implementa la misma API de consultas; el cast solo unifica el tipo para el resto de la app.
  return {
    db: drizzlePglite(client, { schema }) as unknown as Db,
    close: () => client.close(),
  };
}

/** Conexión compartida del proceso (en desarrollo se reutiliza entre recargas). */
export function getConnection(): Promise<Connection> {
  if (!globalForDb.connection) globalForDb.connection = connect();
  return globalForDb.connection;
}

export async function getDb(): Promise<Db> {
  return (await getConnection()).db;
}

export async function closeDb(): Promise<void> {
  if (globalForDb.connection) {
    const { close } = await globalForDb.connection;
    globalForDb.connection = undefined;
    await close();
  }
}
