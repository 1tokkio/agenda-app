"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { FieldErrors } from "@/lib/booking-rules";
import { type Block, type Meeting, type StaffUser } from "./data";
import type { Result } from "./types";

export type SlotState =
  | { kind: "free" }
  | { kind: "booked"; meeting: Meeting }
  | { kind: "blocked"; block: Block };

export type AgendaMode = "public" | "admin";

type MeetingInput = Omit<Meeting, "id">;
type UserInput = Omit<StaffUser, "id"> & { password: string };

type AgendaStore = {
  mode: AgendaMode;
  meetings: Meeting[];
  blocks: Block[];
  users: StaffUser[];
  loaded: boolean;
  slotState: (date: string, time: string) => SlotState;
  bookMeeting: (input: MeetingInput) => Promise<Result<Meeting>>;
  updateMeeting: (id: string, input: MeetingInput) => Promise<Result<Meeting>>;
  cancelMeeting: (id: string) => Promise<void>;
  blockSlot: (date: string, time: string, reason: string) => Promise<Result<Block>>;
  unblockSlot: (id: string) => Promise<void>;
  addUser: (input: UserInput) => Promise<Result<StaffUser>>;
  removeUser: (id: string) => Promise<void>;
};

const AgendaContext = createContext<AgendaStore | null>(null);

type AgendaPayload = { meetings: Meeting[]; blocks: Block[]; users?: StaffUser[] };

/** Agenda desde la API: pública o completa para el admin. Devuelve null si la llamada falla. */
async function fetchAgenda(mode: AgendaMode): Promise<AgendaPayload | null> {
  const response = await fetch(mode === "admin" ? "/api/admin/agenda" : "/api/agenda", { cache: "no-store" }).catch(() => null);
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
 * el admin recibe todo y además los usuarios. Se actualiza al guardar cambios y cada 20 s.
 */
export function AgendaProvider({ mode, children }: { mode: AgendaMode; children: React.ReactNode }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loaded, setLoaded] = useState(false);

  const apply = useCallback((data: AgendaPayload) => {
    setMeetings(data.meetings);
    setBlocks(data.blocks);
    setUsers(data.users ?? []);
    setLoaded(true);
  }, []);

  const refresh = useCallback(async () => {
    const data = await fetchAgenda(mode);
    if (data) apply(data);
  }, [mode, apply]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const data = await fetchAgenda(mode);
      if (active && data) apply(data);
    };
    void load();
    const timer = setInterval(() => void load(), 20_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [mode, apply]);

  const slotState = useCallback<AgendaStore["slotState"]>(
    (date, time) => {
      const meeting = meetings.find((m) => m.date === date && m.time === time);
      if (meeting) return { kind: "booked", meeting };
      const block = blocks.find((b) => b.date === date && b.time === time);
      if (block) return { kind: "blocked", block };
      return { kind: "free" };
    },
    [meetings, blocks],
  );

  const bookMeeting = useCallback<AgendaStore["bookMeeting"]>(
    async (input) => {
      const result = await send<{ meeting: Meeting }>("/api/agenda/bookings", { method: "POST", body: JSON.stringify(input) });
      await refresh();
      return result.ok ? { ok: true, value: result.data.meeting } : { ok: false, errors: result.errors };
    },
    [refresh],
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
      users,
      loaded,
      slotState,
      bookMeeting,
      updateMeeting,
      cancelMeeting,
      blockSlot,
      unblockSlot,
      addUser,
      removeUser,
    }),
    [mode, meetings, blocks, users, loaded, slotState, bookMeeting, updateMeeting, cancelMeeting, blockSlot, unblockSlot, addUser, removeUser],
  );

  return <AgendaContext.Provider value={value}>{children}</AgendaContext.Provider>;
}

export function useAgenda(): AgendaStore {
  const store = useContext(AgendaContext);
  if (!store) throw new Error("useAgenda debe usarse dentro de AgendaProvider");
  return store;
}
