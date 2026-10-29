"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { SLOT_TIMES, type Meeting } from "./data";
import { endTime, formatDayLabel } from "./logic";
import { MeetingForm } from "./MeetingForm";
import { UserSidePanel } from "./UserSidePanel";
import { UserAgenda, useClock } from "./UserAgenda";
import { useAgenda } from "./store";

/** Agenda del usuario con sesión: los visitantes no ven el calendario sin iniciar sesión. */
export function PublicView() {
  const { bookMeeting, slotState } = useAgenda();
  const now = useClock();
  const [selected, setSelected] = useState<{ date: string; time: string } | null>(null);
  const [confirmed, setConfirmed] = useState<Meeting | null>(null);

  // Primer horario libre del día: lo usa el botón "Agendar reunión".
  const bookDay = (date: string) => {
    const time = SLOT_TIMES.find((t) => slotState(date, t).kind === "free");
    if (time) setSelected({ date, time });
  };

  return (
    <div className="flex flex-col gap-6 min-[1440px]:flex-row min-[1440px]:items-start min-[1440px]:gap-10">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <section>
          <h1 className="text-[28px] leading-tight font-normal tracking-tight text-text md:text-[34px]" style={{ fontFamily: "var(--font-display)" }}>
            Agenda de reuniones
          </h1>
          <p className="mt-1.5 text-sm text-muted md:text-[15px]">Reserva bloques de 30 minutos en la sala durante los 3 días del evento.</p>
        </section>

        <UserAgenda
          onBookDay={bookDay}
          onSlotClick={(date, time, state) => {
            if (state.kind === "free") setSelected({ date, time });
          }}
        />
      </div>

      <div className="min-[1440px]:sticky min-[1440px]:top-6 min-[1440px]:w-[340px] min-[1440px]:shrink-0">
        <UserSidePanel now={now} />
      </div>

      {selected && (
        <Sheet title="Agendar reunión" description="Confirma el bloque y con quién te reunirás." onClose={() => setSelected(null)}>
          <MeetingForm
            date={selected.date}
            time={selected.time}
            submitLabel="Confirmar reserva"
            onSubmit={bookMeeting}
            onDone={(meeting) => {
              setSelected(null);
              setConfirmed(meeting);
            }}
            onClose={() => setSelected(null)}
          />
        </Sheet>
      )}

      {confirmed && (
        <Sheet title="Reunión confirmada" description={confirmed.title} onClose={() => setConfirmed(null)}>
          <Confirmation meeting={confirmed} onClose={() => setConfirmed(null)} />
        </Sheet>
      )}
    </div>
  );
}

function Confirmation({ meeting, onClose }: { meeting: Meeting; onClose: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-text-2">
        {formatDayLabel(meeting.date)} · {meeting.time} – {endTime(meeting.time)} · Sala única del evento
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted">Confirmación a</dt>
        <dd className="font-medium break-all text-text">
          {meeting.requesterEmail}
          {meeting.guestEmail && <span className="block">y {meeting.guestEmail}</span>}
        </dd>
      </dl>
      <p className="text-sm text-muted">Te enviamos la confirmación por correo. Si necesitas cancelar, escribe al equipo de organización.</p>
      <button type="button" onClick={onClose} className="h-11 rounded-[10px] bg-brand text-sm font-semibold text-brand-ink hover:brightness-110">
        Listo
      </button>
    </div>
  );
}
