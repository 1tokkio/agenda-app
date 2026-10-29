import { and, asc, eq, gte, lte, ne } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { EventConfig } from "@config/event";
import type { Db } from "@/db/client";
import { blocks, bookings, companies, staffUsers } from "@/db/schema";
import type { MailProvider } from "@/mail";
import { renderConfirmation } from "@/mail/templates/confirmation";
import { hashPassword, verifyPassword } from "./password";
import { validateBooking, isValidEmail, type BookingInput, type FieldErrors } from "./booking-rules";
import { formatHour, isoDateInTimeZone } from "./format";
import { slotsForDay } from "./slots";
import { zonedTimeToUtc } from "./time";

/*
 * Servicio de agenda: reglas de negocio sobre la base de datos.
 * Cada escritura va en una transacción: si una regla falla, no queda nada a medias.
 */

export type BookingContext = {
  db: Db;
  cfg: EventConfig;
  mail: MailProvider;
};

export class BookingError extends Error {
  constructor(
    readonly code: "NOT_FOUND" | "INVALID" | "CONFLICT",
    message: string,
    readonly fields?: FieldErrors,
  ) {
    super(message);
    this.name = "BookingError";
  }
}

export type MeetingRecord = BookingInput & { id: string };
export type BlockRecord = { id: string; date: string; time: string; reason: string };
export type StaffRole = "admin" | "member";

/** Usuario con acceso a la agenda, sin datos de acceso: la contraseña nunca sale del servicio. */
export type StaffUserRecord = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: StaffRole;
  companyId: string;
  jobTitle: string | null;
  phone: string | null;
  companyName: string | null;
};

/** Datos que cada usuario completa en su perfil. */
export type ProfileInput = { name: string; email: string; jobTitle: string; phone: string; companyName: string };

const USERNAME = /^[a-z0-9._-]{3,30}$/;
const MIN_PASSWORD_LENGTH = 8;
const PHONE = /^\+?[0-9 ()-]{6,20}$/;

export type AgendaData = { meetings: MeetingRecord[]; blocks: BlockRecord[] };

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** Fecha y hora (zona del evento) de un instante. */
function toDateTime(date: Date, cfg: EventConfig) {
  return { date: isoDateInTimeZone(date, cfg.timezone), time: formatHour(date, cfg.timezone) };
}

function roomId(cfg: EventConfig): string {
  return cfg.rooms[0].id;
}

function eventRange(cfg: EventConfig): { from: Date; to: Date } {
  const starts = cfg.schedule.days.flatMap((d) => slotsForDay(d.date, cfg).map((s) => s.startsAt));
  return { from: new Date(Math.min(...starts)), to: new Date(Math.max(...starts)) };
}

/** Inicio del bloque para una fecha y hora del evento; falla si no es un bloque válido. */
function slotStart(cfg: EventConfig, date: string, time: string): Date {
  const starts = slotsForDay(date, cfg).map((s) => s.startsAt);
  const ms = zonedTimeToUtc(date, time, cfg.timezone);
  if (!starts.includes(ms)) throw new BookingError("INVALID", "El horario no corresponde a un bloque del evento");
  return new Date(ms);
}

function endOf(cfg: EventConfig, startsAt: Date): Date {
  return new Date(startsAt.getTime() + cfg.schedule.slotMinutes * 60_000);
}

/** Código de error de Postgres por violación de índice único. */
function isUniqueViolation(err: unknown): boolean {
  // Drizzle envuelve el error del driver en "cause": revisamos los dos niveles.
  let current: unknown = err;
  for (let depth = 0; depth < 3 && current; depth++) {
    if ((current as { code?: unknown }).code === "23505") return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

/** Reuniones confirmadas y bloqueos de todo el evento. `full` incluye datos personales (solo para el admin). */
export async function listAgenda(ctx: BookingContext, options: { full: boolean }): Promise<AgendaData> {
  const { db, cfg } = ctx;
  const { from, to } = eventRange(cfg);

  const rows = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.status, "confirmed"), gte(bookings.startsAt, from), lte(bookings.startsAt, to)))
    .orderBy(asc(bookings.startsAt));

  const blockRows = await db
    .select()
    .from(blocks)
    .where(and(gte(blocks.startsAt, from), lte(blocks.startsAt, to)))
    .orderBy(asc(blocks.startsAt));

  return {
    meetings: rows.map((r) => {
      const { date, time } = toDateTime(r.startsAt, cfg);
      const base = {
        id: r.id,
        date,
        time,
        title: r.title,
        requesterCompany: r.requesterCompany,
        targetCompanyId: r.targetCompanyId,
      };
      return options.full
        ? { ...base, requesterName: r.requesterName, requesterEmail: r.requesterEmail, guestEmail: r.guestEmail ?? undefined }
        : { ...base, requesterName: "", requesterEmail: "", guestEmail: undefined };
    }),
    blocks: blockRows.map((b) => {
      const { date, time } = toDateTime(b.startsAt, cfg);
      return { id: b.id, date, time, reason: b.reason };
    }),
  };
}

async function assertNoOverlap(tx: Tx, ctx: BookingContext, input: BookingInput, startsAt: Date, ignoreId?: string) {
  const { cfg } = ctx;
  const notSelf = ignoreId ? ne(bookings.id, ignoreId) : undefined;

  const [block] = await tx.select({ id: blocks.id }).from(blocks).where(eq(blocks.startsAt, startsAt)).limit(1);
  if (block) throw new BookingError("CONFLICT", "Ese horario no está disponible");

  const [roomBusy] = await tx
    .select({ id: bookings.id })
    .from(bookings)
    .where(and(eq(bookings.roomId, roomId(cfg)), eq(bookings.startsAt, startsAt), eq(bookings.status, "confirmed"), notSelf))
    .limit(1);
  if (roomBusy) throw new BookingError("CONFLICT", "Ese horario ya está reservado");

  const [companyBusy] = await tx
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.targetCompanyId, input.targetCompanyId),
        eq(bookings.startsAt, startsAt),
        eq(bookings.status, "confirmed"),
        notSelf,
      ),
    )
    .limit(1);
  if (companyBusy) {
    const name = cfg.companies.find((c) => c.id === input.targetCompanyId)?.name ?? "La empresa";
    throw new BookingError("CONFLICT", `${name} ya tiene una reunión a esa hora`);
  }
}

/** Datos normalizados de una reunión (espacios quitados, correo de la otra persona opcional). */
function normalize(input: BookingInput): BookingInput {
  return {
    ...input,
    title: input.title.trim(),
    requesterName: input.requesterName.trim(),
    requesterCompany: input.requesterCompany.trim(),
    requesterEmail: input.requesterEmail.trim(),
    guestEmail: input.guestEmail?.trim() || undefined,
  };
}

async function sendConfirmations(ctx: BookingContext, meeting: BookingInput, startsAt: Date): Promise<boolean> {
  const { cfg, mail } = ctx;
  const target = cfg.companies.find((c) => c.id === meeting.targetCompanyId);
  const recipients = [meeting.requesterEmail, meeting.guestEmail].filter((e): e is string => Boolean(e?.trim()));
  let sent = true;

  for (const to of recipients) {
    try {
      await mail.send(
        renderConfirmation(
          {
            to,
            title: meeting.title,
            requesterName: meeting.requesterName,
            requesterCompany: meeting.requesterCompany,
            targetName: target?.name ?? "",
            roomName: cfg.rooms[0].name,
            startsAt,
            endsAt: endOf(cfg, startsAt),
          },
          cfg,
        ),
      );
    } catch (err) {
      sent = false;
      console.error(`[bookings] no se pudo enviar el correo a ${to}:`, err);
    }
  }
  return sent;
}

/** Crea una reunión confirmada y envía las confirmaciones (solicitante y, si existe, la otra persona). */
export async function createMeeting(ctx: BookingContext, input: BookingInput): Promise<{ meeting: MeetingRecord; mailSent: boolean }> {
  const { db, cfg } = ctx;
  const errors = validateBooking(input, cfg);
  if (Object.keys(errors).length > 0) throw new BookingError("INVALID", "Revisa los datos de la reunión", errors);

  const startsAt = slotStart(cfg, input.date, input.time);
  const values = normalize(input);
  const id = randomUUID();

  try {
    await db.transaction(async (tx) => {
      await assertNoOverlap(tx, ctx, values, startsAt);
      await tx.insert(bookings).values({
        id,
        roomId: roomId(cfg),
        targetCompanyId: values.targetCompanyId,
        title: values.title,
        requesterName: values.requesterName,
        requesterCompany: values.requesterCompany,
        requesterEmail: values.requesterEmail,
        guestEmail: values.guestEmail ?? null,
        startsAt,
        endsAt: endOf(cfg, startsAt),
        status: "confirmed",
      });
    });
  } catch (err) {
    if (err instanceof BookingError) throw err;
    if (isUniqueViolation(err)) throw new BookingError("CONFLICT", "Ese horario fue reservado recién por otra persona");
    throw err;
  }

  const mailSent = await sendConfirmations(ctx, values, startsAt);
  return { meeting: { id, ...values }, mailSent };
}

/** Edita una reunión existente (mismas reglas que al crearla). */
export async function updateMeeting(ctx: BookingContext, id: string, input: BookingInput): Promise<MeetingRecord> {
  const { db, cfg } = ctx;
  const errors = validateBooking(input, cfg);
  if (Object.keys(errors).length > 0) throw new BookingError("INVALID", "Revisa los datos de la reunión", errors);

  const startsAt = slotStart(cfg, input.date, input.time);
  const values = normalize(input);

  try {
    await db.transaction(async (tx) => {
      const [current] = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(and(eq(bookings.id, id), eq(bookings.status, "confirmed")))
        .limit(1);
      if (!current) throw new BookingError("NOT_FOUND", "La reunión no existe o fue cancelada");

      await assertNoOverlap(tx, ctx, values, startsAt, id);
      await tx
        .update(bookings)
        .set({
          targetCompanyId: values.targetCompanyId,
          title: values.title,
          requesterName: values.requesterName,
          requesterCompany: values.requesterCompany,
          requesterEmail: values.requesterEmail,
          guestEmail: values.guestEmail ?? null,
          startsAt,
          endsAt: endOf(cfg, startsAt),
        })
        .where(eq(bookings.id, id));
    });
  } catch (err) {
    if (err instanceof BookingError) throw err;
    if (isUniqueViolation(err)) throw new BookingError("CONFLICT", "Ese horario fue reservado recién por otra persona");
    throw err;
  }

  return { id, ...values };
}

/** Cancela una reunión: el horario y la empresa quedan libres. */
export async function cancelMeeting(ctx: BookingContext, id: string): Promise<void> {
  const { db } = ctx;
  const updated = await db.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, id)).returning({ id: bookings.id });
  if (updated.length === 0) throw new BookingError("NOT_FOUND", "La reunión no existe");
}

/** Bloquea un horario (publicidad, pantalla ocupada, etc.). */
export async function blockSlot(ctx: BookingContext, input: { date: string; time: string; reason: string }): Promise<BlockRecord> {
  const { db, cfg } = ctx;
  const reason = input.reason.trim();
  if (reason.length < 3) throw new BookingError("INVALID", "Indica el motivo del bloqueo", { title: "Indica el motivo del bloqueo" });
  const startsAt = slotStart(cfg, input.date, input.time);
  const id = randomUUID();

  try {
    await db.transaction(async (tx) => {
      const [meeting] = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(and(eq(bookings.roomId, roomId(cfg)), eq(bookings.startsAt, startsAt), eq(bookings.status, "confirmed")))
        .limit(1);
      if (meeting) throw new BookingError("CONFLICT", "Ya hay una reunión en ese horario");
      await tx.insert(blocks).values({ id, roomId: roomId(cfg), startsAt, endsAt: endOf(cfg, startsAt), reason });
    });
  } catch (err) {
    if (err instanceof BookingError) throw err;
    if (isUniqueViolation(err)) throw new BookingError("CONFLICT", "Ese horario ya está bloqueado");
    throw err;
  }
  return { id, date: input.date, time: input.time, reason };
}

export async function unblockSlot(ctx: BookingContext, id: string): Promise<void> {
  const removed = await ctx.db.delete(blocks).where(eq(blocks.id, id)).returning({ id: blocks.id });
  if (removed.length === 0) throw new BookingError("NOT_FOUND", "El bloqueo no existe");
}

const staffColumns = {
  id: staffUsers.id,
  name: staffUsers.name,
  email: staffUsers.email,
  username: staffUsers.username,
  role: staffUsers.role,
  companyId: staffUsers.companyId,
  jobTitle: staffUsers.jobTitle,
  phone: staffUsers.phone,
  companyName: staffUsers.companyName,
};

export async function listStaffUsers(ctx: BookingContext): Promise<StaffUserRecord[]> {
  return ctx.db.select(staffColumns).from(staffUsers).orderBy(asc(staffUsers.name));
}

/** Crea un usuario con usuario y contraseña; no se permiten más de `cfg.maxUsers`. Por defecto es usuario común. */
export async function createStaffUser(
  ctx: BookingContext,
  input: { name: string; email: string; username: string; password: string; companyId: string; role?: StaffRole },
): Promise<StaffUserRecord> {
  const role: StaffRole = input.role ?? "member";
  if (role !== "admin" && role !== "member") throw new BookingError("INVALID", "Rol no válido", { username: "Rol no válido" });
  const { db, cfg } = ctx;
  const fields: FieldErrors = {};
  const name = input.name.trim();
  const email = input.email.trim();
  const username = input.username.trim().toLowerCase();
  if (name.length < 2) fields.requesterName = "Escribe el nombre";
  if (!isValidEmail(email)) fields.requesterEmail = "Correo no válido";
  if (!USERNAME.test(username)) fields.username = "Usa de 3 a 30 letras minúsculas, números, punto, guion o guion bajo";
  if (input.password.length < MIN_PASSWORD_LENGTH) fields.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`;
  if (!cfg.companies.some((c) => c.id === input.companyId)) fields.targetCompanyId = "Elige una empresa";
  if (Object.keys(fields).length > 0) throw new BookingError("INVALID", "Revisa los datos del usuario", fields);

  const id = randomUUID();
  const passwordHash = await hashPassword(input.password);
  try {
    await db.transaction(async (tx) => {
      const existing = await tx.select({ id: staffUsers.id }).from(staffUsers);
      if (existing.length >= cfg.maxUsers) {
        throw new BookingError("INVALID", `Ya hay ${cfg.maxUsers} usuarios creados`, {
          requesterName: `Ya hay ${cfg.maxUsers} usuarios creados`,
        });
      }
      await tx.insert(staffUsers).values({ id, name, email, username, passwordHash, role, companyId: input.companyId });
    });
  } catch (err) {
    if (err instanceof BookingError) throw err;
    if (isUniqueViolation(err)) {
      const message = "Ya existe un usuario con ese correo o nombre de usuario";
      throw new BookingError("CONFLICT", message, { username: message, requesterEmail: message });
    }
    throw err;
  }
  return { id, name, email, username, role, companyId: input.companyId, jobTitle: null, phone: null, companyName: null };
}

/** Perfil de un usuario con sesión. */
export async function getProfile(ctx: BookingContext, id: string): Promise<StaffUserRecord> {
  const [row] = await ctx.db.select(staffColumns).from(staffUsers).where(eq(staffUsers.id, id)).limit(1);
  if (!row) throw new BookingError("NOT_FOUND", "El usuario no existe");
  return row;
}

/** Actualiza el perfil propio. Los campos vacíos opcionales se guardan como vacío (null). */
export async function updateProfile(ctx: BookingContext, id: string, input: ProfileInput): Promise<StaffUserRecord> {
  const name = input.name.trim();
  const email = input.email.trim();
  const jobTitle = input.jobTitle.trim();
  const phone = input.phone.trim();
  const companyName = input.companyName.trim();
  const fields: FieldErrors = {};
  if (name.length < 2) fields.requesterName = "Escribe tu nombre";
  if (!isValidEmail(email)) fields.requesterEmail = "Correo no válido";
  if (jobTitle.length > 80) fields.jobTitle = "Máximo 80 caracteres";
  if (phone && !PHONE.test(phone)) fields.phone = "Teléfono no válido, por ejemplo +56 9 1234 5678";
  if (companyName.length > 120) fields.companyName = "Máximo 120 caracteres";
  if (Object.keys(fields).length > 0) throw new BookingError("INVALID", "Revisa los datos del perfil", fields);

  try {
    const [row] = await ctx.db
      .update(staffUsers)
      .set({ name, email, jobTitle: jobTitle || null, phone: phone || null, companyName: companyName || null })
      .where(eq(staffUsers.id, id))
      .returning(staffColumns);
    if (!row) throw new BookingError("NOT_FOUND", "El usuario no existe");
    return row;
  } catch (err) {
    if (err instanceof BookingError) throw err;
    if (isUniqueViolation(err)) throw new BookingError("CONFLICT", "Ese correo ya está en uso", { requesterEmail: "Ese correo ya está en uso" });
    throw err;
  }
}

/** Comprueba usuario y contraseña para entrar al panel. Devuelve null si no coinciden. */
export async function authenticateStaff(ctx: BookingContext, username: string, password: string): Promise<StaffUserRecord | null> {
  const [row] = await ctx.db
    .select({ ...staffColumns, passwordHash: staffUsers.passwordHash })
    .from(staffUsers)
    .where(eq(staffUsers.username, username.trim().toLowerCase()))
    .limit(1);
  if (!row) return null;
  const { passwordHash, ...user } = row;
  return (await verifyPassword(password, passwordHash)) ? user : null;
}

/** Quita un usuario. Quien administra no puede quitarse a sí mismo ni dejar el panel sin administradores. */
export async function deleteStaffUser(ctx: BookingContext, id: string, actorId: string): Promise<void> {
  if (id === actorId) throw new BookingError("INVALID", "No puedes quitar tu propio usuario");
  await ctx.db.transaction(async (tx) => {
    const [target] = await tx.select({ role: staffUsers.role }).from(staffUsers).where(eq(staffUsers.id, id)).limit(1);
    if (!target) throw new BookingError("NOT_FOUND", "El usuario no existe");
    if (target.role === "admin") {
      const admins = await tx.select({ id: staffUsers.id }).from(staffUsers).where(eq(staffUsers.role, "admin"));
      if (admins.length <= 1) throw new BookingError("INVALID", "Debe quedar al menos un administrador");
    }
    await tx.delete(staffUsers).where(eq(staffUsers.id, id));
  });
}

/** Nombres de empresas por id (para listados). */
export async function companyNames(ctx: BookingContext): Promise<Map<string, string>> {
  const rows = await ctx.db.select({ id: companies.id, name: companies.name }).from(companies);
  return new Map(rows.map((c) => [c.id, c.name]));
}
