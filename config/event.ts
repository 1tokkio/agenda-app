/**
 * Configuración central del evento.
 *
 * Todo lo que puede cambiar (fechas, salas, empresas, horarios, colores)
 * vive en este archivo. Los valores de ejemplo son PROVISIONALES.
 */

export type Company = {
  id: string;
  name: string;
  color: string; // color de marca de la empresa (hex)
  logoUrl?: string;
};

export type Room = {
  id: string;
  name: string;
  capacity: number;
};

export type ScheduleDay = {
  date: string; // YYYY-MM-DD, en la zona horaria del evento
  start: string; // HH:mm, inicio de la jornada
  end: string; // HH:mm, fin de la jornada
};

export type Theme = {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    success: string;
    danger: string;
  };
  fonts: {
    body: string;
    heading: string;
  };
  radius: string; // radio de esquinas de botones y tarjetas
};

export type EventConfig = {
  name: string; // nombre de la app, p. ej. "AgendaFinlandia"
  subtitle: string; // línea pequeña bajo el nombre, p. ej. "EXPOCORMA 2026"
  logoText: string; // iniciales del logo (2 letras)
  timezone: string; // IANA, p. ej. "America/Santiago"
  dates: { start: string; end: string }; // YYYY-MM-DD
  schedule: {
    slotMinutes: number; // duración por defecto de cada bloque
    days: ScheduleDay[];
  };
  rooms: Room[];
  companies: Company[];
  maxUsers: number; // máximo de usuarios del personal
  idleResetSeconds: number; // reinicio del tótem por inactividad
  theme: Theme;
};

export const eventConfig: EventConfig = {
  name: "AgendaFinlandia",
  subtitle: "EXPOCORMA 2026",
  logoText: "AF",
  timezone: "America/Santiago",
  dates: { start: "2026-11-18", end: "2026-11-20" },

  schedule: {
    slotMinutes: 30, // cada reunión dura 30 minutos (un bloque)
    days: [
      { date: "2026-11-18", start: "10:00", end: "19:00" },
      { date: "2026-11-19", start: "10:00", end: "19:00" },
      { date: "2026-11-20", start: "10:00", end: "19:00" },
    ],
  },

  // Un solo lugar de reuniones.
  rooms: [{ id: "sala-unica", name: "Sala única", capacity: 1 }],

  companies: [
    { id: "empresa-a", name: "Empresa A", color: "#1d4ed8" },
    { id: "empresa-b", name: "Empresa B", color: "#047857" },
    { id: "empresa-c", name: "Empresa C", color: "#b45309" },
    { id: "empresa-d", name: "Empresa D", color: "#7c3aed" },
    { id: "empresa-e", name: "Empresa E", color: "#be185d" },
    { id: "empresa-f", name: "Empresa F", color: "#0e7490" },
  ],

  maxUsers: 30, // usuarios del personal de las empresas
  idleResetSeconds: 30,

  theme: {
    colors: {
      primary: "#003580", // azul de la bandera de Finlandia
      secondary: "#0f172a",
      background: "#ffffff",
      surface: "#ffffff",
      text: "#0f172a",
      textMuted: "#64748b",
      success: "#15803d",
      danger: "#b91c1c",
    },
    fonts: {
      body: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      heading: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    },
    radius: "1rem",
  },
};
