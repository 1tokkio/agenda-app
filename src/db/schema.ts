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

/*
 * Usuarios con acceso a la agenda (máximo 30; se valida en el servicio).
 * - "admin": entra al panel y crea usuarios.
 * - "member": usuario común, solo entra a la agenda y reserva.
 * El acceso (correo y contraseña) vive en Supabase Authentication, con el mismo id.
 */
export const staffUsers = pgTable(
  "staff_users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    // Opcional: sin correo, la cuenta de acceso usa una dirección interna derivada del usuario.
    email: text("email").unique(),
    username: text("username").notNull().unique(),
    role: text("role", { enum: ["admin", "member"] })
      .notNull()
      .default("member"),
    // Datos del perfil que completa cada usuario (opcionales).
    jobTitle: text("job_title"),
    phone: text("phone"),
    companyName: text("company_name"),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id),
  },
  (t) => [check("staff_role_valid", sql`${t.role} in ('admin', 'member')`)],
);

/*
 * Una reunión por bloque en la sala (índice sobre room + starts_at) y
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
    // Usuario que creó la reunión: solo él ve el título en la agenda. Null en reuniones anteriores.
    createdBy: text("created_by").references(() => staffUsers.id, { onDelete: "set null" }),
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

/*
 * Reserva en curso: mientras alguien llena el formulario, el horario queda retenido para su dispositivo
 * (`token`) y nadie más puede tomarlo. Vence sola en `expires_at`; no hace falta ninguna tarea que la limpie.
 * Un horario tiene a lo sumo una retención, y cada dispositivo retiene a lo sumo un horario.
 */
export const slotHolds = pgTable(
  "slot_holds",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id),
    startsAt: instant("starts_at").notNull(),
    token: text("token").notNull(),
    expiresAt: instant("expires_at").notNull(),
  },
  (t) => [
    uniqueIndex("slot_holds_room_slot").on(t.roomId, t.startsAt),
    uniqueIndex("slot_holds_token").on(t.token),
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
