import { sql } from "drizzle-orm";
import type { EventConfig } from "@config/event";
import type { Db } from "./client";
import { companies, rooms } from "./schema";

/*
 * Datos de referencia: empresas y sala, tomados de config/event.ts.
 * Se puede ejecutar varias veces (upsert). Los usuarios los crea el admin desde el panel.
 */
export async function seedReference(db: Db, cfg: EventConfig): Promise<void> {
  await db.transaction(async (tx) => {
    for (const c of cfg.companies) {
      await tx
        .insert(companies)
        .values({ id: c.id, name: c.name, color: c.color, logoUrl: c.logoUrl ?? null })
        .onConflictDoUpdate({
          target: companies.id,
          set: {
            name: sql`excluded.name`,
            color: sql`excluded.color`,
            logoUrl: sql`excluded.logo_url`,
          },
        });
    }

    for (const r of cfg.rooms) {
      await tx
        .insert(rooms)
        .values({ id: r.id, name: r.name, capacity: r.capacity })
        .onConflictDoUpdate({
          target: rooms.id,
          set: { name: sql`excluded.name`, capacity: sql`excluded.capacity` },
        });
    }
  });
}
