import { config } from "@/lib/config";

/*
 * Datos de la agenda para la interfaz. Todo sale de config/event.ts: días, horarios, empresas
 * y máximo de usuarios. Las reuniones y bloqueos llegan desde la API.
 */

export const TIME_ZONE = config.timezone;

/** Los días del evento (YYYY-MM-DD). */
export const DAYS: string[] = config.schedule.days.map((d) => d.date);

/** Inicio de cada bloque del día, según el horario de config/event.ts (se asume el mismo horario para todos los días). */
export const SLOT_TIMES: string[] = (() => {
  const day = config.schedule.days[0];
  const [sh, sm] = day.start.split(":").map(Number);
  const [eh, em] = day.end.split(":").map(Number);
  const times: string[] = [];
  for (let m = sh * 60 + sm; m + config.schedule.slotMinutes <= eh * 60 + em; m += config.schedule.slotMinutes) {
    times.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return times;
})();

export const MAX_USERS = config.maxUsers;
export const COMPANIES = config.companies;

export const companyById = (id: string) => COMPANIES.find((c) => c.id === id);

/** Reunión tal como la muestra la interfaz. En la vista pública los datos personales vienen vacíos. */
export type Meeting = {
  id: string;
  date: string;
  time: string;
  title: string;
  requesterName: string;
  requesterCompany: string;
  targetCompanyId: string;
  requesterEmail: string;
  guestEmail?: string;
};

export type Block = {
  id: string;
  date: string;
  time: string;
  reason: string;
};

export type StaffUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  companyId: string;
};
