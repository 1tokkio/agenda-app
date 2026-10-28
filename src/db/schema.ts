import { sql } from "drizzle-orm";
import { check, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/*
 * Esquema para PostgreSQL (Supabase en producción, PGlite en desarrollo sin base externa).
 * Las reglas de no-duplicidad viven en índices únicos y CHECK, no solo en el código.
 */

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const companies = pgTable("companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  logoUrl: text("logo_url"),
});

export const rooms = pgTable("rooms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull(),
});

// Personal de las empresas con acceso al panel y a la agenda (máximo 30; se valida en el servicio).
export const staffUsers = pgTable("staff_users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id),
});

/*
 * Una reunión por bloque de 30 min en la sala (índice sobre room + starts_at) y
 * una sola reunión por empresa a la misma hora (índice sobre target_company + starts_at).
 * Cancelar cambia el estado: las reuniones canceladas no ocupan horario.
 */
export const bookings = pgTable(
  "bookings",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id),
    targetCompanyId: text("target_company_id")
      .notNull()
      .references(() => companies.id),
    title: text("title").notNull(),
    requesterName: text("requester_name").notNull(),
    requesterCompany: text("requester_company").notNull(),
    requesterEmail: text("requester_email").notNull(),
    guestEmail: text("guest_email"),
    startsAt: instant("starts_at").notNull(),
    endsAt: instant("ends_at").notNull(),
    status: text("status", { enum: ["confirmed", "cancelled"] })
      .notNull()
      .default("confirmed"),
    createdAt: instant("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("bookings_room_slot_confirmed")
      .on(t.roomId, t.startsAt)
      .where(sql`${t.status} = 'confirmed'`),
    uniqueIndex("bookings_company_slot_confirmed")
      .on(t.targetCompanyId, t.startsAt)
      .where(sql`${t.status} = 'confirmed'`),
    check("bookings_status_valid", sql`${t.status} in ('confirmed', 'cancelled')`),
    check("bookings_valid_range", sql`${t.endsAt} > ${t.startsAt}`),
    check("bookings_title_length", sql`length(${t.title}) between 3 and 120`),
  ],
);

// Horarios bloqueados (publicidad, pantalla ocupada, etc.). Un bloqueo por bloque de tiempo.
export const blocks = pgTable(
  "blocks",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id),
    startsAt: instant("starts_at").notNull(),
    endsAt: instant("ends_at").notNull(),
    reason: text("reason").notNull(),
  },
  (t) => [
    uniqueIndex("blocks_room_slot").on(t.roomId, t.startsAt),
    check("blocks_valid_range", sql`${t.endsAt} > ${t.startsAt}`),
  ],
);
