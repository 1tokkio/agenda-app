"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { FieldErrors } from "@/lib/booking-rules";
import { type Block, type Meeting, type StaffUser } from "./data";
import type { Result } from "./types";

/** Horario que alguien está reservando en este momento; `mine` es true si es este dispositivo. */
export type Hold = { date: string; time: string; mine: boolean };

export type SlotState =
  | { kind: "free" }
  | { kind: "booked"; meeting: Meeting }
  | { kind: "blocked"; block: Block }
  | { kind: "held"; mine: boolean };

/** Resultado de retener un horario: cuántos segundos queda retenido, o por qué no se pudo. */
export type HoldResult = { ok: true; ttlSeconds: number } | { ok: false; error: string };

export type AgendaMode = "public" | "admin";

type MeetingInput = Omit<Meeting, "id">;
/** Datos para crear un usuario; el correo puede ir vacío. */
type UserInput = Omit<StaffUser, "id" | "email"> & { email: string; password: string };

type AgendaStore = {
  mode: AgendaMode;
  meetings: Meeting[];
  blocks: Block[];
  holds: Hold[];
  users: StaffUser[];
  loaded: boolean;
  slotState: (date: string, time: string) => SlotState;
  /** Retiene un horario libre mientras se llena el formulario: nadie más puede tomarlo hasta que venza o se suelte. */
  holdSlot: (date: string, time: string) => Promise<HoldResult>;
  /** Suelta el horario que retiene este dispositivo (al cerrar el formulario sin reservar). */
  releaseSlot: () => Promise<void>;
  bookMeeting: (input: MeetingInput) => Promise<Result<Meeting>>;
  updateMeeting: (id: string, input: MeetingInput) => Promise<Result<Meeting>>;
  cancelMeeting: (id: string) => Promise<void>;
  blockSlot: (date: string, time: string, reason: string) => Promise<Result<Block>>;
  unblockSlot: (id: string) => Promise<void>;
  addUser: (input: UserInput) => Promise<Result<StaffUser>>;
  removeUser: (id: string) => Promise<void>;
};

const AgendaContext = createContext<AgendaStore | null>(null);

type AgendaPayload = { meetings: Meeting[]; blocks: Block[]; holds?: Hold[]; users?: StaffUser[] };

/** Cada cuánto se consulta la agenda: lo justo para que un segundo dispositivo vea pronto los horarios en proceso. */
const REFRESH_MS = 5_000;

/** Identificador de este dispositivo (una vez por carga de la página). Distingue quién retiene un horario. */
function makeDeviceToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // Páginas sin contexto seguro (http en red local) no tienen randomUUID.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Agenda desde la API: pública o completa para el admin. Devuelve null si la llamada falla. */
async function fetchAgenda(mode: AgendaMode, token: string): Promise<AgendaPayload | null> {
  const response = await fetch(mode === "admin" ? "/api/admin/agenda" : "/api/agenda", {
    cache: "no-store",
    headers: { "x-hold-token": token },
  }).catch(() => null);
  if (!response?.ok) return null;
  return (await response.json()) as AgendaPayload;
}

/** Errores de la API: los campos del formulario, o un mensaje general asociado al horario. */
function errorsFrom(body: { error?: string; fields?: FieldErrors } | null): FieldErrors {
  if (body?.fields && Object.keys(body.fields).length > 0) return body.fields;
  return { time: body?.error ?? "No se pudo completar la acción. Inténtalo de nuevo." };
}

async function send<T>(url: string, init?: RequestInit): Promise<{ ok: true; data: T } | { ok: false; errors: FieldErrors }> {
  try {
    const response = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    const body = (await response.json().catch(() => null)) as (T & { error?: string; fields?: FieldErrors }) | null;
    if (response.ok && body) return { ok: true, data: body };
    return { ok: false, errors: errorsFrom(body) };
  } catch {
    return { ok: false, errors: { time: "Sin conexión con el servidor. Inténtalo de nuevo." } };
  }
}

/**
 * Estado de la agenda desde la API. La vista pública recibe reuniones sin datos personales;
 * el admin recibe todo y además los usuarios. Se actualiza al guardar cambios y cada pocos segundos, para que
 * dos dispositivos abiertos a la vez vean los horarios que el otro está reservando.
 */
export function AgendaProvider({ mode, children }: { mode: AgendaMode; children: React.ReactNode }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [holds, setHolds] = useState<Hold[]>([]);
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [token] = useState(makeDeviceToken);

  const apply = useCallback((data: AgendaPayload) => {
    setMeetings(data.meetings);
    setBlocks(data.blocks);
    setHolds(data.holds ?? []);
    setUsers(data.users ?? []);
    setLoaded(true);
  }, []);

  const refresh = useCallback(async () => {
    const data = await fetchAgenda(mode, token);
    if (data) apply(data);
  }, [mode, token, apply]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const data = await fetchAgenda(mode, token);
      if (active && data) apply(data);
    };
    void load();
    const timer = setInterval(() => void load(), REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [mode, token, apply]);

  // Si se cierra la pestaña con un formulario abierto, el horario se suelta de inmediato en vez de esperar al vencimiento.
  useEffect(() => {
    const release = () => {
      void fetch("/api/agenda/holds", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        keepalive: true,
      }).catch(() => undefined);
    };
    window.addEventListener("pagehide", release);
    return () => window.removeEventListener("pagehide", release);
  }, [token]);

  const slotState = useCallback<AgendaStore["slotState"]>(
    (date, time) => {
      const meeting = meetings.find((m) => m.date === date && m.time === time);
      if (meeting) return { kind: "booked", meeting };
      const block = blocks.find((b) => b.date === date && b.time === time);
      if (block) return { kind: "blocked", block };
      const hold = holds.find((h) => h.date === date && h.time === time);
      if (hold) return { kind: "held", mine: hold.mine };
      return { kind: "free" };
    },
    [meetings, blocks, holds],
  );

  const holdSlot = useCallback<AgendaStore["holdSlot"]>(
    async (date, time) => {
      const result = await send<{ ttlSeconds: number }>("/api/agenda/holds", { method: "POST", body: JSON.stringify({ date, time, token }) });
      // Se actualiza de inmediato: si otro dispositivo lo tomó, el horario deja de verse libre.
      await refresh();
      return result.ok ? { ok: true, ttlSeconds: result.data.ttlSeconds } : { ok: false, error: result.errors.time ?? "No se pudo reservar el horario." };
    },
    [token, refresh],
  );

  const releaseSlot = useCallback<AgendaStore["releaseSlot"]>(async () => {
    await send("/api/agenda/holds", { method: "DELETE", body: JSON.stringify({ token }) });
    await refresh();
  }, [token, refresh]);

  const bookMeeting = useCallback<AgendaStore["bookMeeting"]>(
    async (input) => {
      const result = await send<{ meeting: Meeting }>("/api/agenda/bookings", {
        method: "POST",
        body: JSON.stringify({ ...input, holdToken: token }),
      });
      await refresh();
      return result.ok ? { ok: true, value: result.data.meeting } : { ok: false, errors: result.errors };
    },
    [token, refresh],
  );

  const updateMeeting = useCallback<AgendaStore["updateMeeting"]>(
    async (id, input) => {
      const result = await send<{ meeting: Meeting }>(`/api/admin/bookings/${id}`, { method: "PUT", body: JSON.stringify(input) });
      await refresh();
      return result.ok ? { ok: true, value: result.data.meeting } : { ok: false, errors: result.errors };
    },
    [refresh],
  );

  const cancelMeeting = useCallback<AgendaStore["cancelMeeting"]>(
    async (id) => {
      await send(`/api/admin/bookings/${id}`, { method: "DELETE" });
      await refresh();
    },
    [refresh],
  );

  const blockSlot = useCallback<AgendaStore["blockSlot"]>(
    async (date, time, reason) => {
      const result = await send<{ block: Block }>("/api/admin/blocks", { method: "POST", body: JSON.stringify({ date, time, reason }) });
      await refresh();
      return result.ok ? { ok: true, value: result.data.block } : { ok: false, errors: result.errors };
    },
    [refresh],
  );

  const unblockSlot = useCallback<AgendaStore["unblockSlot"]>(
    async (id) => {
      await send(`/api/admin/blocks/${id}`, { method: "DELETE" });
      await refresh();
    },
    [refresh],
  );

  const addUser = useCallback<AgendaStore["addUser"]>(
    async (input) => {
      const result = await send<{ user: StaffUser }>("/api/admin/users", { method: "POST", body: JSON.stringify(input) });
      await refresh();
      return result.ok ? { ok: true, value: result.data.user } : { ok: false, errors: result.errors };
    },
    [refresh],
  );

  const removeUser = useCallback<AgendaStore["removeUser"]>(
    async (id) => {
      await send(`/api/admin/users/${id}`, { method: "DELETE" });
      await refresh();
    },
    [refresh],
  );

  const value = useMemo<AgendaStore>(
    () => ({
      mode,
      meetings,
      blocks,
      holds,
      users,
      loaded,
      slotState,
      holdSlot,
      releaseSlot,
      bookMeeting,
      updateMeeting,
      cancelMeeting,
      blockSlot,
      unblockSlot,
      addUser,
      removeUser,
    }),
    [mode, meetings, blocks, holds, users, loaded, slotState, holdSlot, releaseSlot, bookMeeting, updateMeeting, cancelMeeting, blockSlot, unblockSlot, addUser, removeUser],
  );

  return <AgendaContext.Provider value={value}>{children}</AgendaContext.Provider>;
}

export function useAgenda(): AgendaStore {
  const store = useContext(AgendaContext);
  if (!store) throw new Error("useAgenda debe usarse dentro de AgendaProvider");
  return store;
}
