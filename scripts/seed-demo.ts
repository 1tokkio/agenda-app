/*
 * Datos de demostración: reuniones, bloqueos y usuarios de ejemplo.
 * Usa los mismos servicios que la app (mismas reglas), sin enviar correos.
 * Se puede ejecutar varias veces: lo que ya existe o choca se omite.
 */
import { closeDb, getDb } from "../src/db/client";
import { BookingError, blockSlot, createMeeting, createStaffUser, listAgenda, type BookingContext } from "../src/lib/bookings";
import type { BookingInput } from "../src/lib/booking-rules";
import { config } from "../src/lib/config";
import { formatHour } from "../src/lib/format";
import { slotsForDay } from "../src/lib/slots";

const [day1, day2] = config.schedule.days.map((d) => d.date);
const at = (date: string, index: number) => formatHour(new Date(slotsForDay(date, config)[index].startsAt), config.timezone);

const meetings: BookingInput[] = [
  {
    date: day1,
    time: at(day1, 0),
    title: "Presentación de catálogo 2027",
    requesterName: "Camila Rojas",
    requesterCompany: "Distribuidora Norte",
    targetCompanyId: "empresa-a",
    requesterEmail: "camila@ejemplo.cl",
  },
  {
    date: day1,
    time: at(day1, 3),
    title: "Alianza logística",
    requesterName: "Pedro Soto",
    requesterCompany: "Transportes Sur",
    targetCompanyId: "empresa-c",
    requesterEmail: "pedro@ejemplo.cl",
    guestEmail: "gerencia@ejemplo.cl",
  },
  {
    date: day2,
    time: at(day2, 8),
    title: "Proveedores de empaque",
    requesterName: "Lucía Mena",
    requesterCompany: "Packing Lab",
    targetCompanyId: "empresa-e",
    requesterEmail: "lucia@ejemplo.cl",
  },
];

const blocksToAdd = [
  { date: day1, time: at(day1, 6), reason: "Pausa de publicidad" },
  { date: day2, time: at(day2, 4), reason: "Sala en mantención" },
];

const users = [
  { name: "Ana Pérez", email: "ana@empresa-a.example", companyId: "empresa-a" },
  { name: "Luis Soto", email: "luis@empresa-b.example", companyId: "empresa-b" },
  { name: "Marta Ruiz", email: "marta@empresa-c.example", companyId: "empresa-c" },
];

async function main() {
  const ctx: BookingContext = { db: await getDb(), cfg: config, mail: { name: "silencioso", async send() {} } };

  let meetingsAdded = 0;
  for (const m of meetings) {
    try {
      await createMeeting(ctx, m);
      meetingsAdded++;
    } catch (err) {
      if (!(err instanceof BookingError)) throw err;
    }
  }

  let blocksAdded = 0;
  const existingBlocks = (await listAgenda(ctx, { full: false })).blocks;
  for (const b of blocksToAdd) {
    if (existingBlocks.some((e) => e.date === b.date && e.time === b.time)) continue;
    try {
      await blockSlot(ctx, b);
      blocksAdded++;
    } catch (err) {
      if (!(err instanceof BookingError)) throw err;
    }
  }

  let usersAdded = 0;
  for (const u of users) {
    try {
      await createStaffUser(ctx, u);
      usersAdded++;
    } catch (err) {
      if (!(err instanceof BookingError)) throw err;
    }
  }

  await closeDb();
  console.log(`Datos de demostración: ${meetingsAdded} reuniones, ${blocksAdded} bloqueos y ${usersAdded} usuarios agregados.`);
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
