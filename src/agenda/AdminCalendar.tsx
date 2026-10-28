"use client";

import { useState } from "react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { CalendarGrid } from "./CalendarGrid";
import { SummaryPanel } from "./SummaryPanel";
import { MeetingForm } from "./MeetingForm";
import { type Block, type Meeting } from "./data";
import { endTime, formatDayLabel } from "./logic";
import type { FieldErrors } from "@/lib/booking-rules";
import { useAgenda, type SlotState } from "./store";

type Dialog =
  | { kind: "elegir"; date: string; time: string }
  | { kind: "agendar"; date: string; time: string }
  | { kind: "editar"; meeting: Meeting }
  | { kind: "bloquear"; date: string; time: string }
  | { kind: "desbloquear"; block: Block };

/** Calendario del admin: igual que el público, más edición, bloqueos y liberación de horarios. */
export function AdminCalendar() {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const { bookMeeting, updateMeeting, cancelMeeting, blockSlot, unblockSlot } = useAgenda();

  function handleSlot(date: string, time: string, state: SlotState) {
    if (state.kind === "free") setDialog({ kind: "elegir", date, time });
    if (state.kind === "booked") setDialog({ kind: "editar", meeting: state.meeting });
    if (state.kind === "blocked") setDialog({ kind: "desbloquear", block: state.block });
  }

  const close = () => setDialog(null);

  return (
    <div className="flex flex-col gap-8">
      <SummaryPanel />

      <div>
        <h2 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">Calendario</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Toca un horario libre para agendar o bloquearlo. Toca una reunión para editarla o cancelarla.
        </p>
      </div>

      <CalendarGrid mode="admin" onSlotClick={handleSlot} />

      <Modal isOpen={dialog?.kind === "elegir"} onClose={close} className="max-w-md p-6 sm:p-8">
        {dialog?.kind === "elegir" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Horario libre</h2>
            <p className="text-base text-gray-500 dark:text-gray-400">
              {formatDayLabel(dialog.date)} · {dialog.time} – {endTime(dialog.time)}
            </p>
            <Button className="min-h-12" onClick={() => setDialog({ kind: "agendar", date: dialog.date, time: dialog.time })}>
              Agendar reunión
            </Button>
            <Button variant="outline" className="min-h-12" onClick={() => setDialog({ kind: "bloquear", date: dialog.date, time: dialog.time })}>
              Bloquear horario (publicidad u otro motivo)
            </Button>
          </div>
        )}
      </Modal>

      <Modal isOpen={dialog?.kind === "agendar"} onClose={close} className="max-w-xl p-6 sm:p-8">
        {dialog?.kind === "agendar" && (
          <MeetingForm
            date={dialog.date}
            time={dialog.time}
            submitLabel="Agendar"
            onSubmit={bookMeeting}
            onDone={close}
            onClose={close}
          />
        )}
      </Modal>

      <Modal isOpen={dialog?.kind === "editar"} onClose={close} className="max-w-xl p-6 sm:p-8">
        {dialog?.kind === "editar" && (
          <MeetingForm
            date={dialog.meeting.date}
            time={dialog.meeting.time}
            initial={dialog.meeting}
            submitLabel="Guardar cambios"
            onSubmit={(input) => updateMeeting(dialog.meeting.id, input)}
            onDone={close}
            onCancelMeeting={() => {
              cancelMeeting(dialog.meeting.id);
              close();
            }}
            onClose={close}
          />
        )}
      </Modal>

      <Modal isOpen={dialog?.kind === "bloquear"} onClose={close} className="max-w-md p-6 sm:p-8">
        {dialog?.kind === "bloquear" && (
          <BlockForm
            date={dialog.date}
            time={dialog.time}
            onBlock={async (reason) => {
              const result = await blockSlot(dialog.date, dialog.time, reason);
              if (result.ok) close();
              return result.ok ? undefined : result.errors;
            }}
            onClose={close}
          />
        )}
      </Modal>

      <Modal isOpen={dialog?.kind === "desbloquear"} onClose={close} className="max-w-md p-6 sm:p-8">
        {dialog?.kind === "desbloquear" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Horario bloqueado</h2>
            <p className="text-base text-gray-500 dark:text-gray-400">Motivo: {dialog.block.reason}</p>
            <Button
              className="min-h-12"
              onClick={() => {
                unblockSlot(dialog.block.id);
                close();
              }}
            >
              Liberar horario
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function BlockForm({
  date,
  time,
  onBlock,
  onClose,
}: {
  date: string;
  time: string;
  onBlock: (reason: string) => Promise<FieldErrors | undefined>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | undefined>();
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const errors = await onBlock(reason);
        setError(errors?.title ?? errors?.time);
      }}
    >
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Bloquear horario</h2>
      <p className="text-base text-gray-500 dark:text-gray-400">
        {formatDayLabel(date)} · {time}
      </p>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Motivo</span>
        <input
          className="h-12 rounded-lg border border-gray-300 bg-white px-4 text-base text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej.: Pausa de publicidad"
        />
        {error && <span role="alert" className="text-sm text-error-600">{error}</span>}
      </label>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" className="min-h-12" onClick={onClose}>Volver</Button>
        <Button type="submit" className="min-h-12">Bloquear</Button>
      </div>
    </form>
  );
}
