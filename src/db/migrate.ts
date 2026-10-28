import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { closeDb, getDb } from "./client";

/*
 * Aplica las migraciones pendientes. Con DATABASE_URL usa esa base (Supabase);
 * sin ella, aplica las migraciones a la base local de PGlite.
 */
async function main() {
  const url = process.env.DATABASE_URL;

  if (url) {
    const client = postgres(url, { prepare: false, max: 1 });
    await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
    await client.end();
  } else {
    const db = await getDb();
    const { migrate: migratePglite } = await import("drizzle-orm/pglite/migrator");
    await migratePglite(db as unknown as Parameters<typeof migratePglite>[0], { migrationsFolder: "./drizzle" });
    await closeDb();
  }

  console.log(url ? "Migraciones aplicadas en la base de datos configurada." : "Migraciones aplicadas en la base local (PGlite).");
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
