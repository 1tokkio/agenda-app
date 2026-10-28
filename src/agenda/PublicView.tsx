"use client";

import { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { CalendarGrid } from "./CalendarGrid";
import { MeetingForm } from "./MeetingForm";
import { companyById, type Meeting } from "./data";
import { endTime, formatDayLabel } from "./logic";
import { useAgenda } from "./store";

/** Vista pública: tótem y dispositivos de cualquier visitante (sin inicio de sesión). */
export function PublicView() {
  const { bookMeeting } = useAgenda();
  const [selected, setSelected] = useState<{ date: string; time: string } | null>(null);
  const [confirmed, setConfirmed] = useState<Meeting | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-title-sm font-bold text-gray-800 dark:text-white/90">Agenda de reuniones</h1>
        <p className="mt-2 text-base text-gray-500 md:hidden dark:text-gray-400">
          Toca un horario disponible para agendar. Cada reunión dura 30 minutos y se realiza en la sala del evento.
        </p>
      </section>

      <Legend />

      <CalendarGrid
        fit
        mode="public"
        onSlotClick={(date, time, state) => {
          if (state.kind === "free") setSelected({ date, time });
        }}
      />

      <Modal isOpen={selected !== null} onClose={() => setSelected(null)} className="max-w-xl p-6 sm:p-8">
        {selected && (
          <MeetingForm
            date={selected.date}
            time={selected.time}
            submitLabel="Confirmar reunión"
            onSubmit={bookMeeting}
            onDone={(meeting) => {
              setSelected(null);
              setConfirmed(meeting);
            }}
            onClose={() => setSelected(null)}
          />
        )}
      </Modal>

      <Modal isOpen={confirmed !== null} onClose={() => setConfirmed(null)} className="max-w-md p-6 sm:p-8">
        {confirmed && <Confirmation meeting={confirmed} onClose={() => setConfirmed(null)} />}
      </Modal>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
      <span className="flex items-center gap-2">
        <span className="h-4 w-4 rounded border border-dashed border-brand-300" /> Disponible
      </span>
      <span className="flex items-center gap-2">
        <span className="h-4 w-4 rounded bg-white ring-1 ring-gray-300" /> Reunión agendada
      </span>
      <span className="flex items-center gap-2">
        <span className="h-4 w-4 rounded bg-gray-200" /> No disponible
      </span>
    </div>
  );
}

export function Confirmation({ meeting, onClose }: { meeting: Meeting; onClose: () => void }) {
  const target = companyById(meeting.targetCompanyId);
  return (
    <div className="flex flex-col gap-5">
      <Badge color="success" size="md">Reunión confirmada</Badge>
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">{meeting.title}</h2>
        <p className="mt-1 text-base text-gray-500 dark:text-gray-400">
          {formatDayLabel(meeting.date)} · {meeting.time} – {endTime(meeting.time)}
        </p>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-base">
        <dt className="text-gray-500 dark:text-gray-400">Con</dt>
        <dd className="font-medium text-gray-800 dark:text-white/90">{target?.name}</dd>
        <dt className="text-gray-500 dark:text-gray-400">Sala</dt>
        <dd className="font-medium text-gray-800 dark:text-white/90">Sala única del evento</dd>
        <dt className="text-gray-500 dark:text-gray-400">Confirmación a</dt>
        <dd className="font-medium break-all text-gray-800 dark:text-white/90">
          {meeting.requesterEmail}
          {meeting.guestEmail && <span className="block">y {meeting.guestEmail}</span>}
        </dd>
      </dl>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Te enviamos la confirmación por correo. Si necesitas cancelar, escribe al equipo de organización.
      </p>
      <Button onClick={onClose} className="min-h-12 w-full">Listo</Button>
    </div>
  );
}
